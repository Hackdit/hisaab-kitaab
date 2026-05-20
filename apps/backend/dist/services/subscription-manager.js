"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRIAL_DAYS = void 0;
exports.initiateSubscription = initiateSubscription;
exports.activateSubscription = activateSubscription;
exports.cancelSubscription = cancelSubscription;
exports.handlePaymentFailed = handlePaymentFailed;
exports.logPaymentTransaction = logPaymentTransaction;
exports.getTrialStatus = getTrialStatus;
exports.sendTrialNudge = sendTrialNudge;
exports.downgradeExpiredTrials = downgradeExpiredTrials;
exports.handleSubscribeIntent = handleSubscribeIntent;
const supabase_1 = require("../plugins/supabase");
const whatsapp_1 = require("./whatsapp");
const razorpay_1 = require("./razorpay");
exports.TRIAL_DAYS = 14;
/**
 * Initiate a full subscription flow for a business:
 * 1. Create Razorpay customer
 * 2. Create subscription with plan
 * 3. Generate payment link
 * 4. Save to DB
 * 5. Send payment link on WhatsApp
 */
async function initiateSubscription(businessId, plan, whatsappNumber, businessName) {
    try {
        // Get or create Razorpay customer
        const { data: business } = await supabase_1.supabase
            .from('businesses')
            .select('razorpay_customer_id, name')
            .eq('id', businessId)
            .single();
        let customerId = business?.razorpay_customer_id;
        if (!customerId) {
            const customer = await (0, razorpay_1.createRazorpayCustomer)(whatsappNumber, businessName);
            customerId = customer.id;
            // Save customer ID to DB
            await supabase_1.supabase
                .from('businesses')
                .update({ razorpay_customer_id: customerId })
                .eq('id', businessId);
        }
        // Create subscription in Razorpay
        const planId = razorpay_1.PLAN_IDS[plan];
        if (!planId) {
            return { success: false, error: `Invalid plan: ${plan}` };
        }
        const subscription = await (0, razorpay_1.createSubscription)(customerId, planId);
        // Generate payment link
        const amount = razorpay_1.PLAN_PRICES[plan];
        const paymentLink = await (0, razorpay_1.generatePaymentLink)(subscription.id, amount, `Hisab-Kitaab ${razorpay_1.PLAN_NAMES[plan]} Subscription`);
        // Save payment link to DB
        await supabase_1.supabase.from('payment_links').insert({
            business_id: businessId,
            subscription_id: subscription.id,
            razorpay_link_id: paymentLink.id,
            short_url: paymentLink.short_url,
            amount,
            status: 'created',
        });
        // Update business with subscription ID
        await supabase_1.supabase
            .from('businesses')
            .update({ razorpay_subscription_id: subscription.id })
            .eq('id', businessId);
        // Send payment link on WhatsApp
        if (paymentLink.short_url) {
            const planName = razorpay_1.PLAN_NAMES[plan];
            const message = `Aapne ${planName} select kiya hai. ✅\n\n` +
                `Payment link generate ho gaya hai:\n${paymentLink.short_url}\n\n` +
                `Link par click karke payment complete karein. Payment confirm hote hi aapka plan activate ho jayega.`;
            await (0, whatsapp_1.sendTextMessage)(whatsappNumber, message);
        }
        return { success: true, shortUrl: paymentLink.short_url };
    }
    catch (error) {
        console.error('Error initiating subscription:', error);
        return { success: false, error: error.message };
    }
}
/**
 * Activate a subscription after successful payment.
 * Called from Razorpay webhook handler.
 */
async function activateSubscription(subscriptionId) {
    try {
        // Find business by subscription ID
        const { data: business } = await supabase_1.supabase
            .from('businesses')
            .select('id, whatsapp_number, plan')
            .eq('razorpay_subscription_id', subscriptionId)
            .single();
        if (!business) {
            // Try finding by payment link subscription ID
            const { data: paymentLink } = await supabase_1.supabase
                .from('payment_links')
                .select('business_id')
                .eq('subscription_id', subscriptionId)
                .single();
            if (!paymentLink) {
                console.error(`No business found for subscription: ${subscriptionId}`);
                return { success: false };
            }
            // Determine plan from payment link amount
            const { data: linkData } = await supabase_1.supabase
                .from('payment_links')
                .select('amount')
                .eq('subscription_id', subscriptionId)
                .single();
            let targetPlan = 'chhota';
            if (linkData) {
                // Match amount to cheapest plan with that price or higher
                const amount = linkData.amount;
                if (amount >= 2499)
                    targetPlan = 'ca';
                else if (amount >= 999)
                    targetPlan = 'dhanda';
                else if (amount >= 599)
                    targetPlan = 'vyapari';
            }
            await supabase_1.supabase
                .from('businesses')
                .update({
                plan: targetPlan,
                trial_ends_at: null,
                razorpay_subscription_id: subscriptionId,
            })
                .eq('id', paymentLink.business_id);
            // Update payment link status
            await supabase_1.supabase
                .from('payment_links')
                .update({ status: 'paid', paid_at: new Date().toISOString() })
                .eq('subscription_id', subscriptionId);
            // Notify business
            const { data: updated } = await supabase_1.supabase
                .from('businesses')
                .select('whatsapp_number')
                .eq('id', paymentLink.business_id)
                .single();
            if (updated?.whatsapp_number) {
                await (0, whatsapp_1.sendTextMessage)(updated.whatsapp_number, `Aapka plan activate ho gaya hai! ✅\nAb Hisab-Kitaab ke saare features use kar sakte hain.`);
            }
            return { success: true, businessId: paymentLink.business_id };
        }
        // Determine plan from Razorpay subscription plan_id
        // For now, use the existing plan or default to chhota
        const currentPlan = business.plan || 'chhota';
        await supabase_1.supabase
            .from('businesses')
            .update({
            plan: currentPlan,
            trial_ends_at: null,
        })
            .eq('id', business.id);
        // Update payment link status
        await supabase_1.supabase
            .from('payment_links')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .eq('subscription_id', subscriptionId);
        // Notify business
        await (0, whatsapp_1.sendTextMessage)(business.whatsapp_number, `Aapka plan activate ho gaya hai! ✅\nAb Hisab-Kitaab ke saare features use kar sakte hain.`);
        return { success: true, businessId: business.id };
    }
    catch (error) {
        console.error('Error activating subscription:', error);
        return { success: false };
    }
}
/**
 * Handle subscription cancellation gracefully.
 * Downgrades to trial_expired but does NOT delete data.
 */
async function cancelSubscription(subscriptionId) {
    try {
        const { data: business } = await supabase_1.supabase
            .from('businesses')
            .select('id, whatsapp_number')
            .eq('razorpay_subscription_id', subscriptionId)
            .single();
        if (!business) {
            console.error(`No business found for cancelled subscription: ${subscriptionId}`);
            return false;
        }
        // Downgrade to trial_expired
        await supabase_1.supabase
            .from('businesses')
            .update({ plan: 'trial_expired', razorpay_subscription_id: null })
            .eq('id', business.id);
        await (0, whatsapp_1.sendTextMessage)(business.whatsapp_number, `Aapka subscription cancel kar diya gaya hai.\n\n` +
            `Aap Hisab-Kitaab ke basic features use karte rah sakte hain.\n` +
            `Phir se subscribe karne ke liye "subscribe" type karein.`);
        return true;
    }
    catch (error) {
        console.error('Error cancelling subscription:', error);
        return false;
    }
}
/**
 * Handle failed payment notification.
 */
async function handlePaymentFailed(businessId, failureReason) {
    try {
        const { data: business } = await supabase_1.supabase
            .from('businesses')
            .select('whatsapp_number')
            .eq('id', businessId)
            .single();
        if (!business?.whatsapp_number)
            return;
        let message = 'Payment fail ho gaya hai. Kripya dobara try karein.\n\n' +
            'Agar aapko koi problem aa rahi hai to "help" type karein.';
        if (failureReason) {
            message = `Payment fail ho gaya. Reason: ${failureReason}\n\nKripya dobara try karein ya kisi aur card/UPI se payment karein.`;
        }
        await (0, whatsapp_1.sendTextMessage)(business.whatsapp_number, message);
    }
    catch (error) {
        console.error('Error handling payment failure:', error);
    }
}
/**
 * Log a successful payment transaction from webhook.
 */
async function logPaymentTransaction(params) {
    await supabase_1.supabase.from('payment_transactions').insert({
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
function getTrialStatus(business) {
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
async function sendTrialNudge(whatsappNumber, daysLeft) {
    let message;
    if (daysLeft <= 2) {
        message =
            `Sirf ${daysLeft} din baaki hain aapke free trial mein! ⏰\n\n` +
                `Aaj hi subscribe karein:\n` +
                `• ${razorpay_1.PLAN_NAMES.chhota}\n` +
                `• ${razorpay_1.PLAN_NAMES.vyapari}\n` +
                `• ${razorpay_1.PLAN_NAMES.dhanda}\n\n` +
                `Subscribe karne ke liye "subscribe" type karein.`;
    }
    else {
        message =
            `${daysLeft} din baaki hain free trial mein. 😊\n\n` +
                `Hisab-Kitaap aapko pasand aa raha hai?\n` +
                `Subscription plans check karne ke liye "plans" type karein.`;
    }
    await (0, whatsapp_1.sendTextMessage)(whatsappNumber, message);
}
/**
 * Downgrade all businesses with expired trials to trial_expired.
 * Should be called daily by a cron job.
 */
async function downgradeExpiredTrials() {
    const now = new Date().toISOString();
    const { data: expiredBusinesses, error } = await supabase_1.supabase
        .from('businesses')
        .select('id, whatsapp_number')
        .eq('plan', 'trial')
        .lt('trial_ends_at', now);
    if (error || !expiredBusinesses) {
        console.error('Error fetching expired trials:', error);
        return 0;
    }
    for (const business of expiredBusinesses) {
        await supabase_1.supabase
            .from('businesses')
            .update({ plan: 'trial_expired' })
            .eq('id', business.id);
        // Send trial expiry notification
        await (0, whatsapp_1.sendTextMessage)(business.whatsapp_number, `Aapka free trial aaj khatam ho raha hai!\n` +
            `Hisab-Kitaab use karte rehne ke liye subscribe karein:\n` +
            `• ${razorpay_1.PLAN_NAMES.chhota}\n` +
            `• ${razorpay_1.PLAN_NAMES.vyapari}\n` +
            `• ${razorpay_1.PLAN_NAMES.dhanda}\n` +
            `Subscribe karein: ${process.env.FRONTEND_URL || 'https://hisab-kitaab.app'}/subscribe`);
    }
    return expiredBusinesses.length;
}
/**
 * Handle 'subscribe' intent from WhatsApp.
 * Shows plan options or processes a specific plan selection.
 */
async function handleSubscribeIntent(fromNumber, businessId, businessName, plan) {
    if (plan && razorpay_1.PLAN_NAMES[plan]) {
        await initiateSubscription(businessId, plan, fromNumber, businessName);
        return;
    }
    // Show plan options
    const message = `Hisab-Kitaab Subscription Plans:\n\n` +
        `1️⃣ ${razorpay_1.PLAN_NAMES.chhota}\n` +
        `   • 50 invoices/month\n` +
        `   • 100 customers\n` +
        `   • Basic udhaar tracking\n\n` +
        `2️⃣ ${razorpay_1.PLAN_NAMES.vyapari}\n` +
        `   • Unlimited invoices & customers\n` +
        `   • Inventory tracking\n` +
        `   • GST return generator\n` +
        `   • 5 languages support\n\n` +
        `3️⃣ ${razorpay_1.PLAN_NAMES.dhanda}\n` +
        `   • Everything in Vyapari\n` +
        `   • Staff WhatsApp (up to 3)\n` +
        `   • ONDC integration\n` +
        `   • Bulk reminders\n\n` +
        `4️⃣ ${razorpay_1.PLAN_NAMES.ca}\n` +
        `   • Manage up to 50 client businesses\n` +
        `   • White-label invoice branding\n` +
        `   • Bulk GST filing for all clients\n\n` +
        `Select karne ke liye plan name type karein (e.g., "chhota" ya "vyapari")`;
    await (0, whatsapp_1.sendTextMessage)(fromNumber, message);
}
