import { supabase } from '../plugins/supabase';
import { redis } from '../plugins/redis';
import { sendTextMessage } from './whatsapp';
import { scheduleTrialNudges, scheduleTrialExpiry } from './trial-jobs';

export type OnboardingStep = 'start' | 'name' | 'gstin' | 'complete';

export interface WhatsAppState {
  step: OnboardingStep;
  businessName?: string;
  gstin?: string | null;
}

export const STATE_TTL = 60 * 60 * 24; // 24 hours

export function initializeState(): WhatsAppState {
  return { step: 'start' };
}

export async function handleOnboarding(
  fromNumber: string,
  message: string,
  currentState: WhatsAppState | null,
  skipMessage?: boolean
): Promise<{ state: WhatsAppState }> {
  let state = currentState ?? initializeState();
  let responseMessage = '';

  switch (state.step) {
    case 'start':
      state.step = 'name';
      responseMessage =
        "Namaste! \u{1F64F} Main Hisab-Kitaab hun. Aapka business naam kya hai?";
      break;

    case 'name':
      state.businessName = message.trim();
      state.step = 'gstin';
      responseMessage =
        "Aapka GSTIN number kya hai? (skip karne ke liye 'skip' likhein)";
      break;

    case 'gstin': {
      const gstinInput = message.trim();
      if (gstinInput.toLowerCase() !== 'skip') {
        const clean = gstinInput.toUpperCase();
        if (/^[0-9A-Z]{15}$/.test(clean)) {
          state.gstin = clean;
        } else {
          responseMessage =
            "Kya aap yeh sahi GSTIN number bhej rahe hain? GSTIN 15 aksharo ka hota hai. Dobara bhejiye ya 'skip' likhein.";
          return { state };
        }
      } else {
        state.gstin = null;
      }

      state.step = 'complete';

      try {
        const { data: business, error } = await supabase
          .from('businesses')
          .insert({
            business_name: state.businessName,
            gstin: state.gstin,
            whatsapp_number: fromNumber,
          })
          .select()
          .single();

        if (error) throw error;

        // Schedule trial nudges for day 7 and day 12
        if (business.trial_ends_at) {
          try {
            await scheduleTrialNudges(business.id, business.trial_ends_at);
            await scheduleTrialExpiry(business.id, business.trial_ends_at);
          } catch (schedError) {
            console.error('Error scheduling trial jobs:', schedError);
          }
        }

        // Also create the business owner as a customer entry
        await supabase.from('customers').insert({
          business_id: business.id,
          business_name: state.businessName,
          whatsapp_number: fromNumber,
        }).select().single();

        responseMessage =
          "Setup ho gaya! ✅ Abhi try karein: 'Ramesh ko ₹500 ka invoice bhejo'\n\n" +
          "Aap 14 din ka free trial use kar sakte hain! 🎉\n" +
          "Plans dekhne ke liye 'plans' type karein.";
      } catch (dbError) {
        console.error('Error creating business:', dbError);
        responseMessage =
          'Maaf kijiye, kuch gadbad ho gayi. Kripya dobara try karein.';
        state = initializeState();
      }
      break;
    }

    case 'complete':
      responseMessage =
        'Aapka business already setup hai. Aap directly invoice bhej shuru kar sakte hain.';
      break;
  }

  // Save state to Redis first — always persist regardless of message delivery
  const stateKey = `whatsapp:state:${fromNumber}`;
  console.log('REDIS KEY WRITE:', `whatsapp:state:${fromNumber}`);
  console.log('REDIS VALUE:', JSON.stringify(state));
  await redis.set(stateKey, state, { ex: STATE_TTL });

  // Try to send WhatsApp message — never throw, state is already saved
  if (!skipMessage) {
    try {
      await sendTextMessage(fromNumber, responseMessage);
    } catch (msgError) {
      console.error('Error sending WhatsApp message:', msgError);
    }
  }

  return { state };
}

export async function getState(fromNumber: string): Promise<WhatsAppState | null> {
  try {
    const stateKey = `whatsapp:state:${fromNumber}`;
    console.log('REDIS KEY GET:', stateKey);
    const stateValue = await redis.get(stateKey);
    console.log('REDIS GET RESULT:', stateValue);
    if (!stateValue) return null;
    // @upstash/redis already parses JSON automatically
    if (typeof stateValue === 'string') {
      return JSON.parse(stateValue);
    }
    return stateValue as WhatsAppState;
  } catch (error) {
    console.error('Error getting state from Redis:', error);
    return null;
  }
}

export async function saveState(fromNumber: string, state: WhatsAppState): Promise<void> {
  const stateKey = `whatsapp:state:${fromNumber}`;
  await redis.set(stateKey, state, { ex: STATE_TTL });
}