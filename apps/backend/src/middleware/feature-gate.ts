import { PLAN_NAMES } from '../services/razorpay';
import type { Business } from '@hisab-kitaab/db/src/index';

export type Feature =
  | 'create_invoice'
  | 'add_inventory'
  | 'gst_filing'
  | 'bulk_reminder'
  | 'multi_language'
  | 'staff_whatsapp'
  | 'ondc'
  | 'ca_portal'
  | 'white_label'
  | 'client_management';

export interface FeatureCheckResult {
  allowed: boolean;
  upgradeMessage?: string;
  upgradeLink?: string;
  limit?: {
    current: number;
    max: number;
    feature: string;
  };
}

type PlanTier = 'trial' | 'trial_expired' | 'chhota' | 'vyapari' | 'dhanda' | 'ca';

// Feature access per plan
const PLAN_FEATURES: Record<PlanTier, Set<Feature>> = {
  trial: new Set<Feature>(['create_invoice', 'multi_language', 'client_management']),
  trial_expired: new Set<Feature>(['client_management']),
  chhota: new Set<Feature>(['create_invoice', 'multi_language', 'client_management']),
  vyapari: new Set<Feature>([
    'create_invoice',
    'add_inventory',
    'gst_filing',
    'multi_language',
    'client_management',
  ]),
  dhanda: new Set<Feature>([
    'create_invoice',
    'add_inventory',
    'gst_filing',
    'bulk_reminder',
    'multi_language',
    'staff_whatsapp',
    'ondc',
    'ca_portal',
    'client_management',
  ]),
  ca: new Set<Feature>([
    'create_invoice',
    'add_inventory',
    'gst_filing',
    'bulk_reminder',
    'multi_language',
    'staff_whatsapp',
    'ondc',
    'ca_portal',
    'white_label',
    'client_management',
  ]),
};

// Numeric limits per plan
const PLAN_LIMITS: Record<PlanTier, { invoicesPerMonth: number; maxCustomers: number; maxStaffAccounts: number; maxClients: number }> = {
  trial: { invoicesPerMonth: 10, maxCustomers: 20, maxStaffAccounts: 0, maxClients: 1 },
  trial_expired: { invoicesPerMonth: 0, maxCustomers: 0, maxStaffAccounts: 0, maxClients: 1 },
  chhota: { invoicesPerMonth: 50, maxCustomers: 100, maxStaffAccounts: 0, maxClients: 1 },
  vyapari: { invoicesPerMonth: Infinity, maxCustomers: Infinity, maxStaffAccounts: 0, maxClients: 1 },
  dhanda: { invoicesPerMonth: Infinity, maxCustomers: Infinity, maxStaffAccounts: 3, maxClients: 1 },
  ca: { invoicesPerMonth: Infinity, maxCustomers: Infinity, maxStaffAccounts: Infinity, maxClients: 50 },
};

const LANGUAGE_LIMIT: Record<PlanTier, string> = {
  trial: 'Hindi only',
  trial_expired: 'Hindi only',
  chhota: 'Hindi only',
  vyapari: '5 languages',
  dhanda: '5 languages',
  ca: '5 languages',
};

/**
 * Returns the minimum plan that unlocks the given feature.
 * null = even the trial has it.
 */
function minimumPlanForFeature(feature: Feature): PlanTier | null {
  for (const plan of ['trial', 'chhota', 'vyapari', 'dhanda', 'ca'] as PlanTier[]) {
    if (PLAN_FEATURES[plan].has(feature)) {
      return plan === 'trial' ? null : plan;
    }
  }
  return 'ca'; // fallback, shouldn't happen
}

function getUpgradeLink(plan: PlanTier): string {
  return `${process.env.FRONTEND_URL || 'https://hisab-kitaab.app'}/subscribe?plan=${plan}`;
}

const UPGRADE_MESSAGES: Record<string, string> = {
  create_invoice:
    `Yeh feature ${PLAN_NAMES.chhota} plan mein available hai.\n` +
    `Upgrade karein: `,
  add_inventory:
    `Yeh feature ${PLAN_NAMES.vyapari} plan mein hai.\n` +
    `Upgrade karein: `,
  gst_filing:
    `GST filing ${PLAN_NAMES.vyapari} plan mein available hai.\n` +
    `Upgrade karein: `,
  bulk_reminder:
    `Bulk reminders ${PLAN_NAMES.dhanda} plan mein available hain.\n` +
    `Upgrade karein: `,
  multi_language:
    `Multiple languages ${PLAN_NAMES.vyapari} plan mein available hain.\n` +
    `Upgrade karein: `,
  staff_whatsapp:
    `Staff WhatsApp numbers ${PLAN_NAMES.dhanda} plan mein available hain.\n` +
    `Upgrade karein: `,
  ondc:
    `ONDC integration ${PLAN_NAMES.dhanda} plan mein available hai.\n` +
    `Upgrade karein: `,
  ca_portal:
    `CA portal access ${PLAN_NAMES.dhanda} plan mein available hai.\n` +
    `Upgrade karein: `,
  white_label:
    `White-label branding ${PLAN_NAMES.ca} plan mein available hai.\n` +
    `Upgrade karein: `,
  client_management:
    `Multiple client management CA Partner plan (₹2499/mo) mein available hai.\n` +
    `Upgrade karein: `,
};

export const TRIAL_EXPIRED_MESSAGE =
  'Aapka free trial khatam ho gaya hai. Hisab-Kitaab use karte rehne ke liye subscribe karein:\n' +
  `• ${PLAN_NAMES.chhota}\n` +
  `• ${PLAN_NAMES.vyapari}\n` +
  `• ${PLAN_NAMES.dhanda}\n` +
  `Subscribe karein: ${getUpgradeLink('chhota')} wo/default`;

/**
 * Check if a business has access to a specific feature.
 * Handles both feature-based gating and limit-based gating.
 */
export async function checkFeatureAccess(
  business: Pick<Business, 'id' | 'plan' | 'trial_ends_at'>,
  feature: Feature
): Promise<FeatureCheckResult> {
  const plan = (business.plan || 'trial') as PlanTier;

  // If trial has expired, block all non-basic features
  if (plan === 'trial' && business.trial_ends_at) {
    const now = new Date();
    const trialEnd = new Date(business.trial_ends_at);
    if (now > trialEnd) {
      if (feature === 'client_management') {
        return { allowed: true };
      }
      return {
        allowed: false,
        upgradeMessage: TRIAL_EXPIRED_MESSAGE,
        upgradeLink: getUpgradeLink('chhota'),
      };
    }
  }

  // Check if plan allows this feature
  if (!PLAN_FEATURES[plan]?.has(feature)) {
    const minPlan = minimumPlanForFeature(feature);
    if (!minPlan) {
      // Feature should be available on trial, something is wrong
      return { allowed: false, upgradeMessage: UPGRADE_MESSAGES[feature] + getUpgradeLink('chhota'), upgradeLink: getUpgradeLink('chhota') };
    }
    return {
      allowed: false,
      upgradeMessage: UPGRADE_MESSAGES[feature] + getUpgradeLink(minPlan),
      upgradeLink: getUpgradeLink(minPlan),
    };
  }

  // Check numeric limits
  const limits = PLAN_LIMITS[plan];
  if (feature === 'create_invoice' && limits.invoicesPerMonth < Infinity) {
    // Will be checked at usage time with invoice count
    return { allowed: true, limit: { current: 0, max: limits.invoicesPerMonth, feature: 'invoices' } };
  }

  return { allowed: true };
}

/**
 * Get the plan name in Hindi for display.
 */
export function getPlanDisplayName(plan: string): string {
  switch (plan) {
    case 'trial':
      return 'Free Trial';
    case 'trial_expired':
      return 'Trial Expired';
    case 'chhota':
      return 'Chhota Plan (₹299/mo)';
    case 'vyapari':
      return 'Vyapari Plan (₹599/mo)';
    case 'dhanda':
      return 'Dhanda Plan (₹999/mo)';
    case 'ca':
      return 'CA Partner Plan (₹2499/mo)';
    default:
      return 'Free Trial';
  }
}

/**
 * Get current invoice count for a business this month.
 */
export async function getMonthlyInvoiceCount(businessId: string): Promise<number> {
  const { supabase } = await import('../plugins/supabase');
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .gte('created_at', startOfMonth.toISOString());

  if (error) {
    console.error('Error counting monthly invoices:', error);
    return 0;
  }
  return count || 0;
}

/**
 * Get current customer count for a business.
 */
export async function getCustomerCount(businessId: string): Promise<number> {
  const { supabase } = await import('../plugins/supabase');
  const { count, error } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId);

  if (error) {
    console.error('Error counting customers:', error);
    return 0;
  }
  return count || 0;
}

/**
 * Check if a business has exceeded their plan's invoice limit for the month.
 */
export async function checkInvoiceLimit(
  business: Pick<Business, 'id' | 'plan'>
): Promise<FeatureCheckResult> {
  const plan = (business.plan || 'trial') as PlanTier;
  const limits = PLAN_LIMITS[plan];

  if (limits.invoicesPerMonth === Infinity) {
    return { allowed: true };
  }

  const currentCount = await getMonthlyInvoiceCount(business.id);
  if (currentCount >= limits.invoicesPerMonth) {
    const minPlan = plan === 'trial' ? 'chhota' : 'vyapari';
    return {
      allowed: false,
      upgradeMessage: `Aap is mahine ke ${limits.invoicesPerMonth} invoices ki limit cross kar chuke hain.\nUpgrade karein: ${getUpgradeLink(minPlan as PlanTier)}`,
      upgradeLink: getUpgradeLink(minPlan as PlanTier),
      limit: { current: currentCount, max: limits.invoicesPerMonth, feature: 'invoices' },
    };
  }

  return { allowed: true, limit: { current: currentCount, max: limits.invoicesPerMonth, feature: 'invoices' } };
}

/**
 * Get the feature set available for a plan (exported for NLP context).
 */
export function getPlanFeatures(plan: string): string[] {
  return Array.from(PLAN_FEATURES[plan as PlanTier] || []);
}

export { PLAN_LIMITS, PLAN_FEATURES };