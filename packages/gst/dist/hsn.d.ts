/**
 * HSN code lookup table for common MSME products with their GST rates.
 *
 * Sources: CBIC GST rate notifications for goods.
 * Rates are as of FY 2025-26.
 */
export interface HSNEntry {
    hsnCode: string;
    description: string;
    gstRate: number;
}
/** Default GST rate when HSN code is not found */
export declare const DEFAULT_GST_RATE = 18;
/**
 * Look up an HSN code and return its entry (description + GST rate).
 * Returns `undefined` if the code is not in the table.
 */
export declare function lookupHSN(hsnCode: string): HSNEntry | undefined;
/**
 * Get the GST rate for a given HSN code.
 * Falls back to 18% (default rate) if not found.
 */
export declare function getGSTRateByHSN(hsnCode: string): number;
/**
 * Fuzzy search HSN codes by product name or description keyword.
 * Returns up to `limit` matches.
 */
export declare function searchHSN(keyword: string, limit?: number): HSNEntry[];
/**
 * Check if an HSN code corresponds to an exempt good (0% GST).
 */
export declare function isExemptGood(hsnCode: string): boolean;
/**
 * Validate Indian state code (2-letter code).
 */
export declare function isValidStateCode(code: string): boolean;
//# sourceMappingURL=hsn.d.ts.map