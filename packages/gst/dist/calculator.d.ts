import { LineItem, GSTCalculation } from './types';
/**
 * Core GST calculation engine.
 *
 * Determines whether the transaction is inter-state or intra-state based on
 * seller and buyer state codes, then computes CGST/SGST or IGST accordingly.
 *
 * Supports:
 * - Normal GST (varied rates per item)
 * - Exempt goods (gstRate = 0 or isExempt = true)
 * - Composition scheme (flat 1%, no ITC) — pass `isComposition: true`
 *
 * @param items          Line items on the invoice
 * @param sellerState    Seller's state code (e.g. "MH", "DL", "UP")
 * @param buyerState     Buyer's state code
 * @param isComposition  If true, applies flat 1% composition levy
 *                       (no CGST/SGST/IGST split — total tax = 1% of subtotal)
 */
export declare function calculateGST(items: LineItem[], sellerState: string, buyerState: string, isComposition?: boolean): GSTCalculation;
/**
 * Convert a number to words in Indian numbering system (lakhs, crores).
 * Used for "Amount in words" on invoices.
 *
 * Example: 522 → "Rupees Five Hundred Twenty Two Only"
 */
export declare function amountInWords(amount: number): string;
/**
 * Validate a GSTIN (15-character format).
 * Returns `true` if the GSTIN format is valid.
 */
export declare function validateGSTIN(gstin: string): boolean;
//# sourceMappingURL=calculator.d.ts.map