import Razorpay from 'razorpay';
import crypto from 'crypto';
// Plan IDs configured in Razorpay Dashboard
export const PLAN_IDS = {
    chhota: process.env.RAZORPAY_PLAN_CHHOTA || 'plan_chhota',
    vyapari: process.env.RAZORPAY_PLAN_VYAPARI || 'plan_vyapari',
    dhanda: process.env.RAZORPAY_PLAN_DHANDA || 'plan_dhanda',
    ca: process.env.RAZORPAY_PLAN_CA || 'plan_ca',
};
export const PLAN_PRICES = {
    chhota: 299,
    vyapari: 599,
    dhanda: 999,
    ca: 2499,
};
export const PLAN_NAMES = {
    chhota: 'Chhota (₹299/mo)',
    vyapari: 'Vyapari (₹599/mo)',
    dhanda: 'Dhanda (₹999/mo)',
    ca: 'CA Partner (₹2499/mo)',
};
let razorpayInstance = null;
export function getRazorpayInstance() {
    if (!razorpayInstance) {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret) {
            throw new Error('Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET environment variables');
        }
        razorpayInstance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });
    }
    return razorpayInstance;
}
export async function createRazorpayCustomer(whatsappNumber, name) {
    const razorpay = getRazorpayInstance();
    const customer = await razorpay.customers.create({
        name,
        contact: whatsappNumber,
        notes: { source: 'hisab-kitaab-whatsapp' },
    });
    return customer;
}
export async function createSubscription(customerId, planId, totalCount = 12) {
    const razorpay = getRazorpayInstance();
    const subscription = await razorpay.subscriptions.create({
        plan_id: planId,
        customer_id: customerId,
        total_count: totalCount,
        quantity: 1,
        expire_by: 0,
        customer_notify: 1,
        notes: { source: 'hisab-kitaab-whatsapp' },
    });
    return subscription;
}
export async function generatePaymentLink(subscriptionId, amount, description) {
    const razorpay = getRazorpayInstance();
    const paymentLink = await razorpay.links.create({
        amount: amount * 100, // Razorpay expects paise
        currency: 'INR',
        accept_partial: false,
        description,
        subscription_id: subscriptionId,
        callback_url: process.env.RAZORPAY_CALLBACK_URL || 'https://hisab-kitaab.app/payment/success',
        callback_method: 'get',
        notes: { source: 'hisab-kitaab-whatsapp' },
    });
    return paymentLink;
}
export function verifyWebhookSignature(body, signature, webhookSecret) {
    const secret = webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
        throw new Error('Missing RAZORPAY_WEBHOOK_SECRET environment variable');
    }
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
    return expectedSignature === signature;
}
