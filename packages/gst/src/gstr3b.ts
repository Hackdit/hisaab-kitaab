import { GSTR3B, OutwardSupply, ITC, Interest } from './types'

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
export function generateGSTR3B(
  gstin: string,
  fp: string,
  outward: OutwardSupply,
  itc: ITC,
  interest: Interest
): GSTR3B {
  return { gstin, fp, outward, itc, interest }
}

/**
 * Compute outward supply summary from a list of taxable amounts and tax paid.
 */
export function computeOutwardSupply(
  invoices: Array<{ taxableAmount: number; totalTax: number }>
): OutwardSupply {
  return {
    taxable: invoices.reduce((s, inv) => s + inv.taxableAmount, 0),
    tax: invoices.reduce((s, inv) => s + inv.totalTax, 0),
  }
}

/**
 * Compute ITC summary from purchase invoices.
 */
export function computeITC(
  purchases: Array<{ eligible: number; claimed: number }>
): ITC {
  return {
    eligible: purchases.reduce((s, p) => s + p.eligible, 0),
    claimed: purchases.reduce((s, p) => s + p.claimed, 0),
  }
}