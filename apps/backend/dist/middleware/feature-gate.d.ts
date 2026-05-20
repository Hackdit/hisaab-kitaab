import type { Business } from '@hisab-kitaab/db/src/index';
export type Feature = 'create_invoice' | 'add_inventory' | 'gst_filing' | 'bulk_reminder' | 'multi_language' | 'staff_whatsapp' | 'ondc' | 'ca_portal' | 'white_label' | 'client_management';
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
declare const PLAN_FEATURES: Record<PlanTier, Set<Feature>>;
declare const PLAN_LIMITS: Record<PlanTier, {
    invoicesPerMonth: number;
    maxCustomers: number;
    maxStaffAccounts: number;
    maxClients: number;
}>;
export declare const TRIAL_EXPIRED_MESSAGE: string;
/**
 * Check if a business has access to a specific feature.
 * Handles both feature-based gating and limit-based gating.
 */
export declare function checkFeatureAccess(business: Pick<Business, 'id' | 'plan' | 'trial_ends_at'>, feature: Feature): Promise<FeatureCheckResult>;
/**
 * Get the plan name in Hindi for display.
 */
export declare function getPlanDisplayName(plan: string): string;
/**
 * Get current invoice count for a business this month.
 */
export declare function getMonthlyInvoiceCount(businessId: string): Promise<number>;
/**
 * Get current customer count for a business.
 */
export declare function getCustomerCount(businessId: string): Promise<number>;
/**
 * Check if a business has exceeded their plan's invoice limit for the month.
 */
export declare function checkInvoiceLimit(business: Pick<Business, 'id' | 'plan'>): Promise<FeatureCheckResult>;
/**
 * Get the feature set available for a plan (exported for NLP context).
 */
export declare function getPlanFeatures(plan: string): string[];
export { PLAN_LIMITS, PLAN_FEATURES };
