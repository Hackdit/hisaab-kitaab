export interface ParsedSms {
    amount: number;
    payerName?: string;
    date?: string;
    upiReference?: string;
    bankAccount?: string;
}
/**
 * Parse a forwarded bank SMS to extract payment details.
 * Returns null if the message doesn't look like a UPI credit SMS.
 */
export declare function parseBankSms(text: string): ParsedSms | null;
/**
 * Match a payment to an open invoice for a business.
 * Tries exact name match first, then falls back to amount-only matching.
 */
export declare function matchToInvoice(businessId: string, amount: number, payerName: string): Promise<{
    match: boolean;
    invoice?: any;
    possibleInvoices?: any[];
    message: string;
}>;
/**
 * Full reconciliation flow:
 * 1. Parse SMS
 * 2. Match to invoice
 * 3. Auto-mark paid or ask for clarification
 */
export declare function reconcilePayment(fromNumber: string, businessId: string, smsText: string): Promise<{
    reconciled: boolean;
    message: string;
}>;
/**
 * Quick check if a text looks like a forwarded bank SMS.
 * Used to route messages to UPI reconciliation vs regular payment flow.
 */
export declare function looksLikeBankSms(text: string): boolean;
