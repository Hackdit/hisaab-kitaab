import { LineItem, LineItemTax, GSTCalculation } from './types'

/**
 * Round a number to 2 decimal places (standard for currency).
 * Uses bankers' rounding via toFixed which rounds half-up.
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Calculate GST for a single line item.
 *
 * For intrastate (same state): CGST = SGST = gstRate / 2
 * For interstate (different state): IGST = gstRate (full)
 * Exempt goods (rate 0 or isExempt flag): all taxes = 0
 */
function calculateLineItemTax(
  item: LineItem,
  index: number,
  isInterstate: boolean
): LineItemTax {
  if (item.quantity <= 0 || item.rate <= 0) {
    return {
      itemIndex: index,
      taxableAmount: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      total: 0,
    }
  }

  const taxableAmount = round2(item.quantity * item.rate)
  const effectiveRate = item.isExempt || item.gstRate === 0 ? 0 : item.gstRate

  let cgst = 0
  let sgst = 0
  let igst = 0

  if (effectiveRate > 0) {
    if (isInterstate) {
      igst = round2(taxableAmount * effectiveRate / 100)
    } else {
      const halfRate = effectiveRate / 2
      cgst = round2(taxableAmount * halfRate / 100)
      sgst = round2(taxableAmount * halfRate / 100)
    }
  }

  const total = round2(taxableAmount + cgst + sgst + igst)

  return { itemIndex: index, taxableAmount, cgst, sgst, igst, total }
}

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
export function calculateGST(
  items: LineItem[],
  sellerState: string,
  buyerState: string,
  isComposition: boolean = false
): GSTCalculation {
  const isInterstate = sellerState.toUpperCase() !== buyerState.toUpperCase()

  const breakdown: LineItemTax[] = items.map((item, i) =>
    calculateLineItemTax(item, i, isInterstate)
  )

  const subtotal = round2(breakdown.reduce((sum, b) => sum + b.taxableAmount, 0))
  const totalCgst = round2(breakdown.reduce((sum, b) => sum + b.cgst, 0))
  const totalSgst = round2(breakdown.reduce((sum, b) => sum + b.sgst, 0))
  const totalIgst = round2(breakdown.reduce((sum, b) => sum + b.igst, 0))

  let totalTax = round2(totalCgst + totalSgst + totalIgst)
  let finalCgst = totalCgst
  let finalSgst = totalSgst
  let finalIgst = totalIgst

  if (isComposition) {
    // Composition scheme: flat 1% of subtotal, no ITC
    const compositionTax = round2(subtotal * 0.01)
    totalTax = compositionTax
    // Under composition, report all tax as IGST for interstate, or split CGST/SGST for intrastate
    if (isInterstate) {
      finalCgst = 0
      finalSgst = 0
      finalIgst = compositionTax
    } else {
      finalCgst = round2(compositionTax / 2)
      finalSgst = round2(compositionTax / 2)
      finalIgst = 0
    }
    // Also update breakdown to reflect composition
    for (const b of breakdown) {
      const itemTax = round2(b.taxableAmount * 0.01)
      if (isInterstate) {
        b.cgst = 0
        b.sgst = 0
        b.igst = round2(itemTax)
      } else {
        b.cgst = round2(itemTax / 2)
        b.sgst = round2(itemTax / 2)
        b.igst = 0
      }
      b.total = round2(b.taxableAmount + b.cgst + b.sgst + b.igst)
    }
    // Recompute subtotals with composition breakdown
    // (subtotal stays the same, only tax calc changes)
  }

  const preRoundGrand = round2(subtotal + totalTax)
  const roundOff = round2(Math.round(preRoundGrand) - preRoundGrand)
  const grandTotal = round2(preRoundGrand + roundOff)

  return {
    subtotal,
    taxableAmount: subtotal,
    isInterstate,
    cgst: finalCgst,
    sgst: finalSgst,
    igst: finalIgst,
    totalTax,
    grandTotal,
    roundOff,
    breakdown,
  }
}

/**
 * Convert a number to words in Indian numbering system (lakhs, crores).
 * Used for "Amount in words" on invoices.
 *
 * Example: 522 → "Rupees Five Hundred Twenty Two Only"
 */
export function amountInWords(amount: number): string {
  if (amount === 0) return 'Rupees Zero Only'

  const whole = Math.floor(Math.abs(amount))
  const paise = Math.round((Math.abs(amount) - whole) * 100)

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function convertBelow1000(n: number): string {
    if (n === 0) return ''
    const h = Math.floor(n / 100)
    const r = n % 100
    let result = ''
    if (h > 0) result += ones[h] + ' Hundred '
    if (r > 0) {
      if (r < 10) result += ones[r] + ' '
      else if (r < 20) result += teens[r - 10] + ' '
      else {
        const t = Math.floor(r / 10)
        const o = r % 10
        result += tens[t] + ' '
        if (o > 0) result += ones[o] + ' '
      }
    }
    return result.trim()
  }

  function convertIndian(n: number): string {
    if (n === 0) return ''
    const thousands = Math.floor((n % 100000) / 1000)
    const lakhs = Math.floor((n % 10000000) / 100000)
    const crores = Math.floor(n / 10000000)
    const hundreds = n % 1000

    let result = ''
    if (crores > 0) result += convertBelow1000(crores).trim() + ' Crore '
    if (lakhs > 0) result += convertBelow1000(lakhs).trim() + ' Lakh '
    if (thousands > 0) result += convertBelow1000(thousands).trim() + ' Thousand '
    if (hundreds > 0) result += convertBelow1000(hundreds) + ' '

    return result.trim()
  }

  let result = 'Rupees ' + convertIndian(whole).trim()
  if (paise > 0) {
    const paiseStr = convertIndian(paise) || ones[paise]
    result += ' And ' + paiseStr + ' Paise'
  }
  result += ' Only'

  // Collapse multiple spaces
  return result.replace(/\s+/g, ' ')
}

/**
 * Validate a GSTIN (15-character format).
 * Returns `true` if the GSTIN format is valid.
 */
export function validateGSTIN(gstin: string): boolean {
  const clean = gstin.trim().toUpperCase()
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z][Z][0-9A-Z]$/.test(clean)) {
    return false
  }
  // Checksum: last digit validates against a formula
  // For now, format validation is sufficient for Phase 1
  return true
}