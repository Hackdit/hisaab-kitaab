import { redis } from '../plugins/redis';
import { supabase } from '../plugins/supabase';
import { sendTextMessage } from './whatsapp';
import { sendTrialNudge, downgradeExpiredTrials, getTrialStatus, TRIAL_DAYS } from './subscription-manager';

const NUDGE_KEY_PREFIX = 'trial:nudge:';
const EXPIRY_KEY_PREFIX = 'trial:expiry:';
const ONE_HOUR_MS = 60 * 60 * 1000;

let intervalHandle: ReturnType<typeof setInterval> | null = null;

/**
 * Schedule trial nudges for a business:
 * - Day 7 nudge (7 days after signup / 7 days before trial end)
 * - Day 12 nudge (12 days after signup / 2 days before trial end)
 *
 * Stores each as a Redis key with a TTL so expired jobs self-clean.
 */
export async function scheduleTrialNudges(
  businessId: string,
  trialEndsAt: string
): Promise<void> {
  const trialEnd = new Date(trialEndsAt);
  const now = new Date();

  // Day 7 nudge: 7 days before trial end
  const day7Date = new Date(trialEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (day7Date > now) {
    await redis.set(
      `${NUDGE_KEY_PREFIX}${businessId}:day7`,
      JSON.stringify({ businessId, daysLeft: 7, scheduledAt: day7Date.toISOString() }),
      { ex: Math.ceil((day7Date.getTime() - now.getTime()) / 1000) + 3600 }
    );
  }

  // Day 12 nudge: 2 days before trial end
  const day12Date = new Date(trialEnd.getTime() - 2 * 24 * 60 * 60 * 1000);
  if (day12Date > now) {
    await redis.set(
      `${NUDGE_KEY_PREFIX}${businessId}:day12`,
      JSON.stringify({ businessId, daysLeft: 2, scheduledAt: day12Date.toISOString() }),
      { ex: Math.ceil((day12Date.getTime() - now.getTime()) / 1000) + 3600 }
    );
  }
}

/**
 * Schedule trial expiry processing (runs when trial ends).
 * Stores as a Redis key with a TTL so expired jobs self-clean.
 */
export async function scheduleTrialExpiry(
  businessId: string,
  trialEndsAt: string
): Promise<void> {
  const trialEnd = new Date(trialEndsAt);
  const now = new Date();

  if (trialEnd > now) {
    await redis.set(
      `${EXPIRY_KEY_PREFIX}${businessId}`,
      JSON.stringify({ businessId, scheduledAt: trialEnd.toISOString() }),
      { ex: Math.ceil((trialEnd.getTime() - now.getTime()) / 1000) + 3600 }
    );
  }
}

async function processDueNudges(): Promise<void> {
  const keys = await redis.keys(`${NUDGE_KEY_PREFIX}*`);
  if (keys.length === 0) return;

  const now = new Date();

  for (const key of keys) {
    const raw = await redis.get<string>(key);
    if (!raw) continue;

    try {
      const data = JSON.parse(raw);
      const scheduledAt = new Date(data.scheduledAt);

      if (scheduledAt > now) continue;

      const { data: business } = await supabase
        .from('businesses')
        .select('whatsapp_number, plan, trial_ends_at')
        .eq('id', data.businessId)
        .single();

      if (business && business.plan === 'trial') {
        const status = getTrialStatus(business);
        if (!status.isExpired) {
          await sendTrialNudge(business.whatsapp_number, data.daysLeft);
          console.log(`Trial nudge sent for business ${data.businessId} (day ${data.daysLeft})`);
        }
      }
    } catch (err) {
      console.error(`Error processing nudge key ${key}:`, err);
    }

    await redis.del(key);
  }
}

async function processDueExpiries(): Promise<void> {
  const keys = await redis.keys(`${EXPIRY_KEY_PREFIX}*`);
  if (keys.length === 0) return;

  const now = new Date();

  for (const key of keys) {
    const raw = await redis.get<string>(key);
    if (!raw) continue;

    try {
      const data = JSON.parse(raw);
      const scheduledAt = new Date(data.scheduledAt);

      if (scheduledAt > now) continue;

      const { data: business } = await supabase
        .from('businesses')
        .select('id, plan, trial_ends_at, whatsapp_number')
        .eq('id', data.businessId)
        .single();

      if (business && business.plan === 'trial') {
        await supabase
          .from('businesses')
          .update({ plan: 'trial_expired' })
          .eq('id', data.businessId);

        await sendTextMessage(
          business.whatsapp_number,
          `Aapka free trial aaj khatam ho raha hai! 🙏\n` +
            `Hisab-Kitaab use karte rehne ke liye subscribe karein:\n` +
            `• Chhota Plan: ₹299/mo\n` +
            `• Vyapari Plan: ₹599/mo\n` +
            `Subscribe karein: ${process.env.FRONTEND_URL || 'https://hisab-kitaab.app'}/subscribe`
        );

        console.log(`Trial expired for business ${data.businessId}`);
      }
    } catch (err) {
      console.error(`Error processing expiry key ${key}:`, err);
    }

    await redis.del(key);
  }
}

/**
 * Runs every hour: processes due nudges, due expiries,
 * and catches any expired trials that were missed.
 */
async function runHourlyCheck(): Promise<void> {
  console.log('Running hourly trial check...');
  await processDueNudges();
  await processDueExpiries();

  const count = await downgradeExpiredTrials();
  if (count > 0) {
    console.log(`Downgraded ${count} expired trials`);
  }
}

/**
 * Set up all trial management jobs. Called once during server startup.
 * Runs the first check immediately, then every hour thereafter.
 */
export function setupAllWorkers(): { intervalId: ReturnType<typeof setInterval> } {
  runHourlyCheck();
  intervalHandle = setInterval(runHourlyCheck, ONE_HOUR_MS);
  return { intervalId: intervalHandle };
}

/**
 * Gracefully stop all workers.
 */
export async function closeAllWorkers(): Promise<void> {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}