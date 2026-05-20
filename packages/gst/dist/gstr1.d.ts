import { GSTR1, GSTR1Input } from './types';
/**
 * Generate GSTR-1 JSON from a set of invoices for a given period.
 *
 * Follows GSTN JSON schema for offline utility upload.
 *
 * Phase 2 feature — structure is ready for implementation.
 *
 * @param input  Invoices and business GSTIN for the filing period
 * @returns      GSTR-1 JSON object matching GSTN schema
 */
export declare function generateGSTR1(input: GSTR1Input): GSTR1;
//# sourceMappingURL=gstr1.d.ts.map