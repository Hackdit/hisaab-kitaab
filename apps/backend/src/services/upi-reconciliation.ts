import { supabase } from '../plugins/supabase';
import { sendTextMessage } from './whatsapp';

export interface ParsedSms {
  amount: number;
  payerName?: string;
  date?: string;
  upiReference?: string;
  bankAccount?: string;
}

// Regex patterns for Indian bank UPI credit SMS
// Formats vary by bank but common patterns:
// "A/c XX1234 credited with Rs.850 on 09-05-26 by UPI-Ramesh"
// "Rs.500 credited to a/c XX5678 from UPI/Google Pay- Rahul"
// "Credited by UPI/VPA-ramesh@paytm Rs.1000 on 10-05-26"
const UPI_SMS_PATTERNS = [
  // "credited with Rs.X by UPI-name" or "UPI/name"
  /credited\s+(?:with\s+)?(?:Rs\.?|INR)\s*([\d,]+)\s*(?:on\s+[\d\-/]+\s*)?(?:by|from|via)\s+UPI[\s\-/]*(.+?)(?:\s+on\s|$)/i,
  // "Rs.X credited... UPI/VPA-name" or "UPI-ref"
  /(?:Rs\.?|INR)\s*([\d,]+)\s+credited[^.]*(?:UPI|VPA)[\s\-/]*([^\s,.]+)/i,
  // "UPI transaction of Rs.X from name"
  /UPI\s+(?:transaction|payment|transfer|received)\s+(?:of|for|of Rs\.?|of INR)\s*([\d,]+)\s+(?:from|by)\s+(.+?)(?:\s+on\s|$)/i,
  // Generic "amount received from name via UPI"
  /(?:received|credited)\s+(?:Rs\.?|INR)\s*([\d,]+)\s+(?:from|by)\s+(.+?)\s+(?:via|through|using)\s+UPI/i,
  // Simple fallback: "Rs.X received UPI" or "received Rs.X UPI"
  /(?:Rs\.?|INR)\s*([\d,]+)\s+(?:received|credited|paid)\s+(?:.*?)?(?:via\s+)?UPI/i,
];

/**
 * Parse a forwarded bank SMS to extract payment details.
 * Returns null if the message doesn't look like a UPI credit SMS.
 */
export function parseBankSms(text: string): ParsedSms | null {
  let amount: number | null = null;
  let payerName: string | undefined;
  let upiReference: string | undefined;
  let date: string | undefined;

  // Try each pattern
  for (const pattern of UPI_SMS_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      // Parse amount (remove commas)
      const amountStr = match[1]?.replace(/,/g, '');
      if (amountStr) {
        amount = parseFloat(amountStr);
        if (isNaN(amount)) amount = null;
      }

      // Try to extract payer name (group 2 or 3 depending on pattern)
      const nameStr = match[2] || match[3];
      if (nameStr) {
        // Clean up the name - remove trailing dots, dates, "on", "at", etc.
        const cleaned = nameStr
          .replace(/\s+on\s+[\d\-/\.\s]+$/, '')
          .replace(/\s+at\s+[\d:]+\s*$/, '')
          .replace(/\.$/, '')
          .trim();
        if (cleaned && !cleaned.match(/^[\d\-/\s:]+$/)) {
          payerName = cleaned;
        }
      }
      break; // First matching pattern wins
    }
  }

  // If no pattern matched, check if it looks like a payment SMS at all
  if (amount === null) {
    // Check for keywords that suggest payment SMS
    const paymentKeywords = /(?:credited|received|paid|deposit|transfer|upi|payment)/i;
    if (!paymentKeywords.test(text)) {
      return null;
    }

    // Last resort: try to find any numeric amount
    const amountMatch = text.match(/(?:Rs\.?|INR)\s*([\d,]+)/i) ||
      text.match(/([\d,]+)\s*(?:rs\.?|inr)/i);
    if (amountMatch) {
      amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    } else {
      return null;
    }
  }

  // Extract date if present
  const dateMatch = text.match(/(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{2,4})/);
  if (dateMatch) {
    date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
  }

  // Extract UPI reference / transaction ID
  const refMatch = text.match(/UPI[:\s]*([A-Za-z0-9]+)/);
  if (refMatch) {
    upiReference = refMatch[1];
  }

  return {
    amount,
    payerName: payerName || 'Unknown',
    date,
    upiReference,
  };
}

/**
 * Match a payment to an open invoice for a business.
 * Tries exact name match first, then falls back to amount-only matching.
 */
export async function matchToInvoice(
  businessId: string,
  amount: number,
  payerName: string
): Promise<{
  match: boolean;
  invoice?: any;
  possibleInvoices?: any[];
  message: string;
}> {
  // Try to find unpaid invoices for this customer
  const { data: unpaidInvoices, error } = await supabase
    .from('invoices')
    .select('*, customers!inner(name)')
    .eq('business_id', businessId)
    .in('status', ['sent', 'partial'])
    .order('created_at', { ascending: false });

  if (error || !unpaidInvoices || unpaidInvoices.length === 0) {
    return {
      match: false,
      message: `Koi unpaid invoice nahi mila. ₹${amount} ka yeh payment kis invoice ke liye hai?`,
    };
  }

  // Try exact name match
  const nameLower = payerName.toLowerCase().trim();
  const exactMatch = unpaidInvoices.find((inv) => {
    const invName = (inv as any).customers?.name?.toLowerCase().trim() || inv.customer_name?.toLowerCase().trim();
    return invName?.includes(nameLower) || nameLower.includes(invName || '');
  });

  if (exactMatch) {
    const invoiceTotal = exactMatch.total || 0;
    const receivedSoFar = exactMatch.payment_received || 0;
    const remaining = invoiceTotal - receivedSoFar;

    if (amount >= remaining) {
      return {
        match: true,
        invoice: exactMatch,
        message: `Match mil gaya! ✅`,
      };
    } else {
      // Partial payment
      return {
        match: true,
        invoice: exactMatch,
        message: `Partial payment match: Invoice #${exactMatch.invoice_number || exactMatch.id.slice(0, 8)} ka total ₹${invoiceTotal} hai, aapne ₹${amount} bheja. Baaki: ₹${(remaining - amount).toFixed(2)}`,
      };
    }
  }

  // No name match - try amount match
  const amountMatchInvoices = unpaidInvoices.filter((inv) => {
    const invoiceTotal = inv.total || 0;
    const receivedSoFar = inv.payment_received || 0;
    const remaining = invoiceTotal - receivedSoFar;
    // Allow slight variation (+/- ₹5)
    return Math.abs(amount - remaining) <= 5;
  });

  if (amountMatchInvoices.length === 1) {
    return {
      match: true,
      invoice: amountMatchInvoices[0],
      message: `Match mil gaya! ✅`,
    };
  }

  if (amountMatchInvoices.length > 1) {
    // Multiple invoices with same remaining amount - ask user
    const invoiceList = amountMatchInvoices
      .map((inv, i) => `${i + 1}. Invoice #${inv.invoice_number || inv.id.slice(0, 8)} - ₹${inv.total} - ${inv.customer_name || 'Unknown'}`)
      .join('\n');

    return {
      match: false,
      possibleInvoices: amountMatchInvoices,
      message: `₹${amount} ka payment aaya. Kaunse invoice ke liye hai?\n${invoiceList}`,
    };
  }

  // No match found
  return {
    match: false,
    possibleInvoices: unpaidInvoices.slice(0, 5),
    message: `₹${amount} receive hua. Kaunse customer aur invoice ke liye hai? (Customer name batao ya "new udhaar" likho)`,
  };
}

/**
 * Full reconciliation flow:
 * 1. Parse SMS
 * 2. Match to invoice
 * 3. Auto-mark paid or ask for clarification
 */
export async function reconcilePayment(
  fromNumber: string,
  businessId: string,
  smsText: string
): Promise<{
  reconciled: boolean;
  message: string;
}> {
  // Step 1: Parse the SMS
  const parsed = parseBankSms(smsText);
  if (!parsed) {
    return {
      reconciled: false,
      message: '',
    };
  }

  const { amount, payerName } = parsed;

  // Step 2: Try to match to an invoice
  const matchResult = await matchToInvoice(businessId, amount, payerName || 'Unknown');

  // Step 3: If matched, update invoice status
  if (matchResult.match && matchResult.invoice) {
    const invoice = matchResult.invoice;
    const receivedSoFar = invoice.payment_received || 0;
    const newReceived = receivedSoFar + amount;
    const newStatus = newReceived >= (invoice.total || 0) ? 'paid' : 'partial';

    await supabase
      .from('invoices')
      .update({
        status: newStatus,
        payment_received: newReceived,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id);

    // Log the transaction
    const { supabase: db } = await import('../plugins/supabase');
    await db.from('transactions').insert({
      business_id: businessId,
      invoice_id: invoice.id,
      customer_id: invoice.customer_id,
      type: 'payment_in',
      amount,
      payment_mode: 'upi',
      upi_reference: parsed.upiReference || null,
      notes: `UPI auto-reconciled from SMS`,
    });

    await sendTextMessage(
      fromNumber,
      `₹${amount} receive hua ${payerName || 'kisi'} se ✅\n` +
        `Invoice #${invoice.invoice_number || ''} marked as ${newStatus}.\n` +
        `Baaki amount: ₹${Math.max(0, (invoice.total || 0) - newReceived)}`
    );

    return { reconciled: true, message: `Payment reconciled for invoice ${invoice.id}` };
  }

  // Step 4: No match - send clarification message from matchResult
  await sendTextMessage(fromNumber, matchResult.message);

  return { reconciled: false, message: matchResult.message };
}

/**
 * Quick check if a text looks like a forwarded bank SMS.
 * Used to route messages to UPI reconciliation vs regular payment flow.
 */
export function looksLikeBankSms(text: string): boolean {
  const indicators = [
    /credited/i,
    /ac\s+xx\d+/i,
    /upi/i,
    /rs\.?\s*[\d,]+/i,
    /debited/i,
    /trf\s+/i,
    /imps/i,
    /neft/i,
  ];

  let matchCount = 0;
  for (const pattern of indicators) {
    if (pattern.test(text)) matchCount++;
  }

  // At least 2 indicators = likely bank SMS
  return matchCount >= 3;
}