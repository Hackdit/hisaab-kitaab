"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_NAMES = exports.PLAN_PRICES = exports.PLAN_IDS = void 0;
exports.getRazorpayInstance = getRazorpayInstance;
exports.createRazorpayCustomer = createRazorpayCustomer;
exports.createSubscription = createSubscription;
exports.generatePaymentLink = generatePaymentLink;
exports.verifyWebhookSignature = verifyWebhookSignature;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
// Plan IDs configured in Razorpay Dashboard
exports.PLAN_IDS = {
    chhota: process.env.RAZORPAY_PLAN_CHHOTA || 'plan_chhota',
    vyapari: process.env.RAZORPAY_PLAN_VYAPARI || 'plan_vyapari',
    dhanda: process.env.RAZORPAY_PLAN_DHANDA || 'plan_dhanda',
    ca: process.env.RAZORPAY_PLAN_CA || 'plan_ca',
};
exports.PLAN_PRICES = {
    chhota: 299,
    vyapari: 599,
    dhanda: 999,
    ca: 2499,
};
exports.PLAN_NAMES = {
    chhota: 'Chhota (₹299/mo)',
    vyapari: 'Vyapari (₹599/mo)',
    dhanda: 'Dhanda (₹999/mo)',
    ca: 'CA Partner (₹2499/mo)',
};
let razorpayInstance = null;
function getRazorpayInstance() {
    if (!razorpayInstance) {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret) {
            throw new Error('Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET environment variables');
        }
        razorpayInstance = new razorpay_1.default({
            key_id: keyId,
            key_secret: keySecret,
        });
    }
    return razorpayInstance;
}
async function createRazorpayCustomer(whatsappNumber, name) {
    const razorpay = getRazorpayInstance();
    const customer = await razorpay.customers.create({
        name,
        contact: whatsappNumber,
        notes: { source: 'hisab-kitaab-whatsapp' },
    });
    return customer;
}
async function createSubscription(customerId, planId, totalCount = 12) {
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
async function generatePaymentLink(subscriptionId, amount, description) {
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
function verifyWebhookSignature(body, signature, webhookSecret) {
    const secret = webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
        throw new Error('Missing RAZORPAY_WEBHOOK_SECRET environment variable');
    }
    const expectedSignature = crypto_1.default
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
    return expectedSignature === signature;
}
