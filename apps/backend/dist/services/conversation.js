import { supabase } from '../plugins/supabase';
import { redis } from '../plugins/redis';
import { sendTextMessage } from './whatsapp';
import { scheduleTrialNudges, scheduleTrialExpiry } from './trial-jobs';
export const STATE_TTL = 60 * 60 * 24; // 24 hours
export function initializeState() {
    return { step: 'start' };
}
export async function handleOnboarding(fromNumber, message, currentState) {
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
                }
                else {
                    responseMessage =
                        "Kya aap yeh sahi GSTIN number bhej rahe hain? GSTIN 15 aksharo ka hota hai. Dobara bhejiye ya 'skip' likhein.";
                    return { state };
                }
            }
            else {
                state.gstin = null;
            }
            state.step = 'complete';
            try {
                const { data: business, error } = await supabase
                    .from('businesses')
                    .insert({
                    name: state.businessName,
                    gstin: state.gstin,
                    whatsapp_number: fromNumber,
                })
                    .select()
                    .single();
                if (error)
                    throw error;
                // Schedule trial nudges for day 7 and day 12
                if (business.trial_ends_at) {
                    try {
                        await scheduleTrialNudges(business.id, business.trial_ends_at);
                        await scheduleTrialExpiry(business.id, business.trial_ends_at);
                    }
                    catch (schedError) {
                        console.error('Error scheduling trial jobs:', schedError);
                    }
                }
                // Also create the business owner as a customer entry
                await supabase.from('customers').insert({
                    business_id: business.id,
                    name: state.businessName,
                    whatsapp_number: fromNumber,
                }).select().single();
                responseMessage =
                    "Setup ho gaya! ✅ Abhi try karein: 'Ramesh ko ₹500 ka invoice bhejo'\n\n" +
                        "Aap 14 din ka free trial use kar sakte hain! 🎉\n" +
                        "Plans dekhne ke liye 'plans' type karein.";
            }
            catch (dbError) {
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
    await sendTextMessage(fromNumber, responseMessage);
    // Save state to Redis
    const stateKey = `whatsapp:state:${fromNumber}`;
    await redis.set(stateKey, JSON.stringify(state), 'EX', STATE_TTL);
    return { state };
}
export async function getState(fromNumber) {
    try {
        const stateKey = `whatsapp:state:${fromNumber}`;
        const stateValue = await redis.get(stateKey);
        return stateValue ? JSON.parse(stateValue) : null;
    }
    catch (error) {
        console.error('Error getting state from Redis:', error);
        return null;
    }
}
export async function saveState(fromNumber, state) {
    const stateKey = `whatsapp:state:${fromNumber}`;
    await redis.set(stateKey, JSON.stringify(state), 'EX', STATE_TTL);
}
