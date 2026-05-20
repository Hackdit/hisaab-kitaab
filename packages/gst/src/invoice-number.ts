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
export function getFinancialYear(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = date.getMonth() // 0-indexed: 0=Jan, 3=Apr
  const startYear = month >= 3 ? year : year - 1
  const endYear = startYear + 1
  const shortStart = String(startYear).slice(-2)
  const shortEnd = String(endYear).slice(-2)
  return `${shortStart}${shortEnd}`
}

/**
 * Generate the next invoice number.
 *
 * @param prefix      Business prefix (default "HK")
 * @param fy          Financial year string (e.g. "2526")
 * @param nextSeq     Next sequence number (1-based)
 * @param padLength   How many digits to pad (default 4 → 0001)
 */
export function generateInvoiceNumber(
  prefix: string,
  fy: string,
  nextSeq: number,
  padLength: number = 4
): string {
  const seq = String(nextSeq).padStart(padLength, '0')
  return `${prefix}-${fy}-${seq}`
}

/**
 * Parse an invoice number into its components.
 * Returns null if the format doesn't match.
 */
export function parseInvoiceNumber(
  invoiceNumber: string
): { prefix: string; fy: string; seq: number } | null {
  const match = invoiceNumber.match(/^([A-Z]+)-(\d{4})-(\d+)$/)
  if (!match) return null
  return {
    prefix: match[1],
    fy: match[2],
    seq: parseInt(match[3], 10),
  }
}