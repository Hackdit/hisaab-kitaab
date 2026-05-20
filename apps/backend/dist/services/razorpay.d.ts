import Razorpay from 'razorpay';
export declare const PLAN_IDS: Record<string, string>;
export declare const PLAN_PRICES: Record<string, number>;
export declare const PLAN_NAMES: Record<string, string>;
export declare function getRazorpayInstance(): Razorpay;
export declare function createRazorpayCustomer(whatsappNumber: string, name: string): Promise<any>;
export declare function createSubscription(customerId: string, planId: string, totalCount?: number): Promise<any>;
export declare function generatePaymentLink(subscriptionId: string, amount: number, description: string): Promise<any>;
export declare function verifyWebhookSignature(body: string, signature: string, webhookSecret?: string): boolean;
