import { GSTR3B, OutwardSupply, ITC, Interest } from './types';
/**
 * Generate GSTR-3B data from outward supplies and ITC.
 *
 * Auto-computes summary values for monthly return filing.
 *
 * Phase 2 feature — structure is ready for implementation.
 *
 * @param gstin     Business GSTIN
 * @param fp        Filing period (MMYYYY format, e.g. "032026")
 * @param outward   Summary of outward taxable supplies
 * @param itc       Eligible and claimed ITC
 * @param interest  Late fee and interest payable
 */
export declare function generateGSTR3B(gstin: string, fp: string, outward: OutwardSupply, itc: ITC, interest: Interest): GSTR3B;
/**
 * Compute outward supply summary from a list of taxable amounts and tax paid.
 */
export declare function computeOutwardSupply(invoices: Array<{
    taxableAmount: number;
    totalTax: number;
}>): OutwardSupply;
/**
 * Compute ITC summary from purchase invoices.
 */
export declare function computeITC(purchases: Array<{
    eligible: number;
    claimed: number;
}>): ITC;
//# sourceMappingURL=gstr3b.d.ts.map