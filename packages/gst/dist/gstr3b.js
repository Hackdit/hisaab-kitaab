"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGSTR3B = generateGSTR3B;
exports.computeOutwardSupply = computeOutwardSupply;
exports.computeITC = computeITC;
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
function generateGSTR3B(gstin, fp, outward, itc, interest) {
    return { gstin, fp, outward, itc, interest };
}
/**
 * Compute outward supply summary from a list of taxable amounts and tax paid.
 */
function computeOutwardSupply(invoices) {
    return {
        taxable: invoices.reduce((s, inv) => s + inv.taxableAmount, 0),
        tax: invoices.reduce((s, inv) => s + inv.totalTax, 0),
    };
}
/**
 * Compute ITC summary from purchase invoices.
 */
function computeITC(purchases) {
    return {
        eligible: purchases.reduce((s, p) => s + p.eligible, 0),
        claimed: purchases.reduce((s, p) => s + p.claimed, 0),
    };
}
//# sourceMappingURL=gstr3b.js.map