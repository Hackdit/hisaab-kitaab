export type SubscriptionPlan = 'chhota' | 'vyapari' | 'dhanda' | 'ca';
export declare const TRIAL_DAYS = 14;
/**
 * Initiate a full subscription flow for a business:
 * 1. Create Razorpay customer
 * 2. Create subscription with plan
 * 3. Generate payment link
 * 4. Save to DB
 * 5. Send payment link on WhatsApp
 */
export declare function initiateSubscription(businessId: string, plan: SubscriptionPlan, whatsappNumber: string, businessName: string): Promise<{
    success: boolean;
    shortUrl?: string;
    error?: string;
}>;
/**
 * Activate a subscription after successful payment.
 * Called from Razorpay webhook handler.
 */
export declare function activateSubscription(subscriptionId: string): Promise<{
    success: boolean;
    businessId?: string;
}>;
/**
 * Handle subscription cancellation gracefully.
 * Downgrades to trial_expired but does NOT delete data.
 */
export declare function cancelSubscription(subscriptionId: string): Promise<boolean>;
/**
 * Handle failed payment notification.
 */
export declare function handlePaymentFailed(businessId: string, failureReason?: string): Promise<void>;
/**
 * Log a successful payment transaction from webhook.
 */
export declare function logPaymentTransaction(params: {
    businessId: string;
    razorpayPaymentId: string;
    razorpaySubscriptionId?: string;
    razorpayOrderId?: string;
    amount: number;
    method?: string;
    upiId?: string;
    bankTransactionId?: string;
    invoiceId?: string;
}): Promise<void>;
/**
 * Get trial status for a business.
 */
export declare function getTrialStatus(business: {
    plan: string;
    trial_ends_at?: string | null;
}): {
    isActive: boolean;
    daysRemaining: number;
    isExpired: boolean;
};
/**
 * Send a trial nudge message on WhatsApp.
 * Day 7: "7 din baaki hain free trial mein"
 * Day 12: "2 din baaki — aaj hi subscribe karein"
 */
export declare function sendTrialNudge(whatsappNumber: string, daysLeft: number): Promise<void>;
/**
 * Downgrade all businesses with expired trials to trial_expired.
 * Should be called daily by a cron job.
 */
export declare function downgradeExpiredTrials(): Promise<number>;
/**
 * Handle 'subscribe' intent from WhatsApp.
 * Shows plan options or processes a specific plan selection.
 */
export declare function handleSubscribeIntent(fromNumber: string, businessId: string, businessName: string, plan?: string): Promise<void>;
