"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_FEATURES = exports.PLAN_LIMITS = exports.TRIAL_EXPIRED_MESSAGE = void 0;
exports.checkFeatureAccess = checkFeatureAccess;
exports.getPlanDisplayName = getPlanDisplayName;
exports.getMonthlyInvoiceCount = getMonthlyInvoiceCount;
exports.getCustomerCount = getCustomerCount;
exports.checkInvoiceLimit = checkInvoiceLimit;
exports.getPlanFeatures = getPlanFeatures;
const razorpay_1 = require("../services/razorpay");
// Feature access per plan
const PLAN_FEATURES = {
    trial: new Set(['create_invoice', 'multi_language', 'client_management']),
    trial_expired: new Set(['client_management']),
    chhota: new Set(['create_invoice', 'multi_language', 'client_management']),
    vyapari: new Set([
        'create_invoice',
        'add_inventory',
        'gst_filing',
        'multi_language',
        'client_management',
    ]),
    dhanda: new Set([
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
    ca: new Set([
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
exports.PLAN_FEATURES = PLAN_FEATURES;
// Numeric limits per plan
const PLAN_LIMITS = {
    trial: { invoicesPerMonth: 10, maxCustomers: 20, maxStaffAccounts: 0, maxClients: 1 },
    trial_expired: { invoicesPerMonth: 0, maxCustomers: 0, maxStaffAccounts: 0, maxClients: 1 },
    chhota: { invoicesPerMonth: 50, maxCustomers: 100, maxStaffAccounts: 0, maxClients: 1 },
    vyapari: { invoicesPerMonth: Infinity, maxCustomers: Infinity, maxStaffAccounts: 0, maxClients: 1 },
    dhanda: { invoicesPerMonth: Infinity, maxCustomers: Infinity, maxStaffAccounts: 3, maxClients: 1 },
    ca: { invoicesPerMonth: Infinity, maxCustomers: Infinity, maxStaffAccounts: Infinity, maxClients: 50 },
};
exports.PLAN_LIMITS = PLAN_LIMITS;
const LANGUAGE_LIMIT = {
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
function minimumPlanForFeature(feature) {
    for (const plan of ['trial', 'chhota', 'vyapari', 'dhanda', 'ca']) {
        if (PLAN_FEATURES[plan].has(feature)) {
            return plan === 'trial' ? null : plan;
        }
    }
    return 'ca'; // fallback, shouldn't happen
}
function getUpgradeLink(plan) {
    return `${process.env.FRONTEND_URL || 'https://hisab-kitaab.app'}/subscribe?plan=${plan}`;
}
const UPGRADE_MESSAGES = {
    create_invoice: `Yeh feature ${razorpay_1.PLAN_NAMES.chhota} plan mein available hai.\n` +
        `Upgrade karein: `,
    add_inventory: `Yeh feature ${razorpay_1.PLAN_NAMES.vyapari} plan mein hai.\n` +
        `Upgrade karein: `,
    gst_filing: `GST filing ${razorpay_1.PLAN_NAMES.vyapari} plan mein available hai.\n` +
        `Upgrade karein: `,
    bulk_reminder: `Bulk reminders ${razorpay_1.PLAN_NAMES.dhanda} plan mein available hain.\n` +
        `Upgrade karein: `,
    multi_language: `Multiple languages ${razorpay_1.PLAN_NAMES.vyapari} plan mein available hain.\n` +
        `Upgrade karein: `,
    staff_whatsapp: `Staff WhatsApp numbers ${razorpay_1.PLAN_NAMES.dhanda} plan mein available hain.\n` +
        `Upgrade karein: `,
    ondc: `ONDC integration ${razorpay_1.PLAN_NAMES.dhanda} plan mein available hai.\n` +
        `Upgrade karein: `,
    ca_portal: `CA portal access ${razorpay_1.PLAN_NAMES.dhanda} plan mein available hai.\n` +
        `Upgrade karein: `,
    white_label: `White-label branding ${razorpay_1.PLAN_NAMES.ca} plan mein available hai.\n` +
        `Upgrade karein: `,
    client_management: `Multiple client management CA Partner plan (₹2499/mo) mein available hai.\n` +
        `Upgrade karein: `,
};
exports.TRIAL_EXPIRED_MESSAGE = 'Aapka free trial khatam ho gaya hai. Hisab-Kitaab use karte rehne ke liye subscribe karein:\n' +
    `• ${razorpay_1.PLAN_NAMES.chhota}\n` +
    `• ${razorpay_1.PLAN_NAMES.vyapari}\n` +
    `• ${razorpay_1.PLAN_NAMES.dhanda}\n` +
    `Subscribe karein: ${getUpgradeLink('chhota')} wo/default`;
/**
 * Check if a business has access to a specific feature.
 * Handles both feature-based gating and limit-based gating.
 */
async function checkFeatureAccess(business, feature) {
    const plan = (business.plan || 'trial');
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
                upgradeMessage: exports.TRIAL_EXPIRED_MESSAGE,
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
function getPlanDisplayName(plan) {
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
async function getMonthlyInvoiceCount(businessId) {
    const { supabase } = await Promise.resolve().then(() => __importStar(require('../plugins/supabase')));
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
async function getCustomerCount(businessId) {
    const { supabase } = await Promise.resolve().then(() => __importStar(require('../plugins/supabase')));
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
async function checkInvoiceLimit(business) {
    const plan = (business.plan || 'trial');
    const limits = PLAN_LIMITS[plan];
    if (limits.invoicesPerMonth === Infinity) {
        return { allowed: true };
    }
    const currentCount = await getMonthlyInvoiceCount(business.id);
    if (currentCount >= limits.invoicesPerMonth) {
        const minPlan = plan === 'trial' ? 'chhota' : 'vyapari';
        return {
            allowed: false,
            upgradeMessage: `Aap is mahine ke ${limits.invoicesPerMonth} invoices ki limit cross kar chuke hain.\nUpgrade karein: ${getUpgradeLink(minPlan)}`,
            upgradeLink: getUpgradeLink(minPlan),
            limit: { current: currentCount, max: limits.invoicesPerMonth, feature: 'invoices' },
        };
    }
    return { allowed: true, limit: { current: currentCount, max: limits.invoicesPerMonth, feature: 'invoices' } };
}
/**
 * Get the feature set available for a plan (exported for NLP context).
 */
function getPlanFeatures(plan) {
    return Array.from(PLAN_FEATURES[plan] || []);
}
