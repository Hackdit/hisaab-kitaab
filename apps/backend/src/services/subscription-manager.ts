import { supabase } from '../plugins/supabase';
import { sendTextMessage } from './whatsapp';
import {
  createRazorpayCustomer,
  createSubscription,
  generatePaymentLink,
  PLAN_IDS,
  PLAN_PRICES,
  PLAN_NAMES,
} from './razorpay';

export type SubscriptionPlan = 'chhota' | 'vyapari' | 'dhanda' | 'ca';

export const TRIAL_DAYS = 14;

/**
 * Initiate a full subscription flow for a business:
 * 1. Create Razorpay customer
 * 2. Create subscription with plan
 * 3. Generate payment link
 * 4. Save to DB
 * 5. Send payment link on WhatsApp
 */
export async function initiateSubscription(
  businessId: string,
  plan: SubscriptionPlan,
  whatsappNumber: string,
  businessName: string
): Promise<{ success: boolean; shortUrl?: string; error?: string }> {
  try {
    // Get or create Razorpay customer
    const { data: business } = await supabase
      .from('businesses')
      .select('razorpay_customer_id, name')
      .eq('id', businessId)
      .single();

    let customerId = business?.razorpay_customer_id;

    if (!customerId) {
      const customer = await createRazorpayCustomer(whatsappNumber, businessName);
      customerId = customer.id;

      // Save customer ID to DB
      await supabase
        .from('businesses')
        .update({ razorpay_customer_id: customerId })
        .eq('id', businessId);
    }

    // Create subscription in Razorpay
    const planId = PLAN_IDS[plan];
    if (!planId) {
      return { success: false, error: `Invalid plan: ${plan}` };
    }

    const subscription = await createSubscription(customerId, planId);

    // Generate payment link
    const amount = PLAN_PRICES[plan];
    const paymentLink = await generatePaymentLink(
      subscription.id,
      amount,
      `Hisab-Kitaab ${PLAN_NAMES[plan]} Subscription`
    );

    // Save payment link to DB
    await supabase.from('payment_links').insert({
      business_id: businessId,
      subscription_id: subscription.id,
      razorpay_link_id: paymentLink.id,
      short_url: paymentLink.short_url,
      amount,
      status: 'created',
    });

    // Update business with subscription ID
    await supabase
      .from('businesses')
      .update({ razorpay_subscription_id: subscription.id })
      .eq('id', businessId);

    // Send payment link on WhatsApp
    if (paymentLink.short_url) {
      const planName = PLAN_NAMES[plan];
      const message =
        `Aapne ${planName} select kiya hai. ✅\n\n` +
        `Payment link generate ho gaya hai:\n${paymentLink.short_url}\n\n` +
        `Link par click karke payment complete karein. Payment confirm hote hi aapka plan activate ho jayega.`;

      await sendTextMessage(whatsappNumber, message);
    }

    return { success: true, shortUrl: paymentLink.short_url };
  } catch (error) {
    console.error('Error initiating subscription:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Activate a subscription after successful payment.
 * Called from Razorpay webhook handler.
 */
export async function activateSubscription(
  subscriptionId: string
): Promise<{ success: boolean; businessId?: string }> {
  try {
    // Find business by subscription ID
    const { data: business } = await supabase
      .from('businesses')
      .select('id, whatsapp_number, plan')
      .eq('razorpay_subscription_id', subscriptionId)
      .single();

    if (!business) {
      // Try finding by payment link subscription ID
      const { data: paymentLink } = await supabase
        .from('payment_links')
        .select('business_id')
        .eq('subscription_id', subscriptionId)
        .single();

      if (!paymentLink) {
        console.error(`No business found for subscription: ${subscriptionId}`);
        return { success: false };
      }

      // Determine plan from payment link amount
      const { data: linkData } = await supabase
        .from('payment_links')
        .select('amount')
        .eq('subscription_id', subscriptionId)
        .single();

      let targetPlan = 'chhota';
      if (linkData) {
        // Match amount to cheapest plan with that price or higher
        const amount = linkData.amount;
        if (amount >= 2499) targetPlan = 'ca';
        else if (amount >= 999) targetPlan = 'dhanda';
        else if (amount >= 599) targetPlan = 'vyapari';
      }

      await supabase
        .from('businesses')
        .update({
          plan: targetPlan,
          trial_ends_at: null,
          razorpay_subscription_id: subscriptionId,
        })
        .eq('id', paymentLink.business_id);

      // Update payment link status
      await supabase
        .from('payment_links')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('subscription_id', subscriptionId);

      // Notify business
      const { data: updated } = await supabase
        .from('businesses')
        .select('whatsapp_number')
        .eq('id', paymentLink.business_id)
        .single();

      if (updated?.whatsapp_number) {
        await sendTextMessage(
          updated.whatsapp_number,
          `Aapka plan activate ho gaya hai! ✅\nAb Hisab-Kitaab ke saare features use kar sakte hain.`
        );
      }

      return { success: true, businessId: paymentLink.business_id };
    }

    // Determine plan from Razorpay subscription plan_id
    // For now, use the existing plan or default to chhota
    const currentPlan = business.plan || 'chhota';

    await supabase
      .from('businesses')
      .update({
        plan: currentPlan,
        trial_ends_at: null,
      })
      .eq('id', business.id);

    // Update payment link status
    await supabase
      .from('payment_links')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('subscription_id', subscriptionId);

    // Notify business
    await sendTextMessage(
      business.whatsapp_number,
      `Aapka plan activate ho gaya hai! ✅\nAb Hisab-Kitaab ke saare features use kar sakte hain.`
    );

    return { success: true, businessId: business.id };
  } catch (error) {
    console.error('Error activating subscription:', error);
    return { success: false };
  }
}

/**
 * Handle subscription cancellation gracefully.
 * Downgrades to trial_expired but does NOT delete data.
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<boolean> {
  try {
    const { data: business } = await supabase
      .from('businesses')
      .select('id, whatsapp_number')
      .eq('razorpay_subscription_id', subscriptionId)
      .single();

    if (!business) {
      console.error(`No business found for cancelled subscription: ${subscriptionId}`);
      return false;
    }

    // Downgrade to trial_expired
    await supabase
      .from('businesses')
      .update({ plan: 'trial_expired', razorpay_subscription_id: null })
      .eq('id', business.id);

    await sendTextMessage(
      business.whatsapp_number,
      `Aapka subscription cancel kar diya gaya hai.\n\n` +
        `Aap Hisab-Kitaab ke basic features use karte rah sakte hain.\n` +
        `Phir se subscribe karne ke liye "subscribe" type karein.`
    );

    return true;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return false;
  }
}

/**
 * Handle failed payment notification.
 */
export async function handlePaymentFailed(
  businessId: string,
  failureReason?: string
): Promise<void> {
  try {
    const { data: business } = await supabase
      .from('businesses')
      .select('whatsapp_number')
      .eq('id', businessId)
      .single();

    if (!business?.whatsapp_number) return;

    let message =
      'Payment fail ho gaya hai. Kripya dobara try karein.\n\n' +
      'Agar aapko koi problem aa rahi hai to "help" type karein.';

    if (failureReason) {
      message = `Payment fail ho gaya. Reason: ${failureReason}\n\nKripya dobara try karein ya kisi aur card/UPI se payment karein.`;
    }

    await sendTextMessage(business.whatsapp_number, message);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

/**
 * Log a successful payment transaction from webhook.
 */
export async function logPaymentTransaction(params: {
  businessId: string;
  razorpayPaymentId: string;
  razorpaySubscriptionId?: string;
  razorpayOrderId?: string;
  amount: number;
  method?: string;
  upiId?: string;
  bankTransactionId?: string;
  invoiceId?: string;
}): Promise<void> {
  await supabase.from('payment_transactions').insert({
    business_id: params.businessId,
    invoice_id: params.invoiceId || null,
    razorpay_payment_id: params.razorpayPaymentId,
    razorpay_subscription_id: params.razorpaySubscriptionId || null,
    razorpay_order_id: params.razorpayOrderId || null,
    amount: params.amount,
    status: 'captured',
    method: params.method || null,
    upi_id: params.upiId || null,
    bank_transaction_id: params.bankTransactionId || null,
  });
}

/**
 * Get trial status for a business.
 */
export function getTrialStatus(business: { plan: string; trial_ends_at?: string | null }): {
  isActive: boolean;
  daysRemaining: number;
  isExpired: boolean;
} {
  if (business.plan !== 'trial' || !business.trial_ends_at) {
    return { isActive: false, daysRemaining: 0, isExpired: business.plan === 'trial_expired' };
  }

  const now = new Date();
  const trialEnd = new Date(business.trial_ends_at);
  const diffMs = trialEnd.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    isActive: daysRemaining > 0,
    daysRemaining: Math.max(0, daysRemaining),
    isExpired: daysRemaining <= 0,
  };
}

/**
 * Send a trial nudge message on WhatsApp.
 * Day 7: "7 din baaki hain free trial mein"
 * Day 12: "2 din baaki — aaj hi subscribe karein"
 */
export async function sendTrialNudge(whatsappNumber: string, daysLeft: number): Promise<void> {
  let message: string;

  if (daysLeft <= 2) {
    message =
      `Sirf ${daysLeft} din baaki hain aapke free trial mein! ⏰\n\n` +
      `Aaj hi subscribe karein:\n` +
      `• ${PLAN_NAMES.chhota}\n` +
      `• ${PLAN_NAMES.vyapari}\n` +
      `• ${PLAN_NAMES.dhanda}\n\n` +
      `Subscribe karne ke liye "subscribe" type karein.`;
  } else {
    message =
      `${daysLeft} din baaki hain free trial mein. 😊\n\n` +
      `Hisab-Kitaap aapko pasand aa raha hai?\n` +
      `Subscription plans check karne ke liye "plans" type karein.`;
  }

  await sendTextMessage(whatsappNumber, message);
}

/**
 * Downgrade all businesses with expired trials to trial_expired.
 * Should be called daily by a cron job.
 */
export async function downgradeExpiredTrials(): Promise<number> {
  const now = new Date().toISOString();

  const { data: expiredBusinesses, error } = await supabase
    .from('businesses')
    .select('id, whatsapp_number')
    .eq('plan', 'trial')
    .lt('trial_ends_at', now);

  if (error || !expiredBusinesses) {
    console.error('Error fetching expired trials:', error);
    return 0;
  }

  for (const business of expiredBusinesses) {
    await supabase
      .from('businesses')
      .update({ plan: 'trial_expired' })
      .eq('id', business.id);

    // Send trial expiry notification
    await sendTextMessage(
      business.whatsapp_number,
      `Aapka free trial aaj khatam ho raha hai!\n` +
        `Hisab-Kitaab use karte rehne ke liye subscribe karein:\n` +
        `• ${PLAN_NAMES.chhota}\n` +
        `• ${PLAN_NAMES.vyapari}\n` +
        `• ${PLAN_NAMES.dhanda}\n` +
        `Subscribe karein: ${process.env.FRONTEND_URL || 'https://hisab-kitaab.app'}/subscribe`
    );
  }

  return expiredBusinesses.length;
}

/**
 * Handle 'subscribe' intent from WhatsApp.
 * Shows plan options or processes a specific plan selection.
 */
export async function handleSubscribeIntent(
  fromNumber: string,
  businessId: string,
  businessName: string,
  plan?: string
): Promise<void> {
  if (plan && PLAN_NAMES[plan]) {
    await initiateSubscription(businessId, plan as SubscriptionPlan, fromNumber, businessName);
    return;
  }

  // Show plan options
  const message =
    `Hisab-Kitaab Subscription Plans:\n\n` +
    `1️⃣ ${PLAN_NAMES.chhota}\n` +
    `   • 50 invoices/month\n` +
    `   • 100 customers\n` +
    `   • Basic udhaar tracking\n\n` +
    `2️⃣ ${PLAN_NAMES.vyapari}\n` +
    `   • Unlimited invoices & customers\n` +
    `   • Inventory tracking\n` +
    `   • GST return generator\n` +
    `   • 5 languages support\n\n` +
    `3️⃣ ${PLAN_NAMES.dhanda}\n` +
    `   • Everything in Vyapari\n` +
    `   • Staff WhatsApp (up to 3)\n` +
    `   • ONDC integration\n` +
    `   • Bulk reminders\n\n` +
    `4️⃣ ${PLAN_NAMES.ca}\n` +
    `   • Manage up to 50 client businesses\n` +
    `   • White-label invoice branding\n` +
    `   • Bulk GST filing for all clients\n\n` +
    `Select karne ke liye plan name type karein (e.g., "chhota" ya "vyapari")`;

  await sendTextMessage(fromNumber, message);
}