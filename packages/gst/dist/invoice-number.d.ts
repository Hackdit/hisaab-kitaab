/**
 * Invoice number generation.
 *
 * Format: HK-{FY}-{SEQUENCE}
 * Example: HK-2526-0001 (FY 2025-26, first invoice)
 *
 * Sequence resets at April 1st each year (start of Indian financial year).
 */
/**
 * Get the financial year string for a given date.
 * FY runs April 1 to March 31.
 * e.g. 2025-04-01 → "2526",  2026-03-31 → "2526"
 */
export declare function getFinancialYear(date?: Date): string;
/**
 * Generate the next invoice number.
 *
 * @param prefix      Business prefix (default "HK")
 * @param fy          Financial year string (e.g. "2526")
 * @param nextSeq     Next sequence number (1-based)
 * @param padLength   How many digits to pad (default 4 → 0001)
 */
export declare function generateInvoiceNumber(prefix: string, fy: string, nextSeq: number, padLength?: number): string;
/**
 * Parse an invoice number into its components.
 * Returns null if the format doesn't match.
 */
export declare function parseInvoiceNumber(invoiceNumber: string): {
    prefix: string;
    fy: string;
    seq: number;
} | null;
//# sourceMappingURL=invoice-number.d.ts.map