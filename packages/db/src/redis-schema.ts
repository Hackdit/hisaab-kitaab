// Redis Conversation State Schema
// Key: whatsapp:state:{phone_number}
// TTL: 30 minutes (1800 seconds)

export interface ConversationState {
  step: ConversationStep
  context: ConversationContext
  business_id: string
  language: 'hi' | 'ta' | 'te' | 'bn' | 'kn' | 'en'
}

export type ConversationStep =
  | 'awaiting_customer_name'
  | 'awaiting_customer_phone'
  | 'awaiting_customer_gstin'
  | 'awaiting_customer_address'
  | 'awaiting_items'
  | 'awaiting_item_name'
  | 'awaiting_item_hsn'
  | 'awaiting_item_quantity'
  | 'awaiting_item_rate'
  | 'awaiting_confirm_invoice'
  | 'awaiting_payment_mode'
  | 'awaiting_upi_reference'
  | 'awaiting_transaction_amount'
  | 'awaiting_adjustment_reason'
  | 'awaiting_stock_product'
  | 'awaiting_stock_quantity'
  | 'awaiting_stock_type'
  | 'awaiting_add_more_items'
  | 'awaiting_send_invoice'
  | 'completed'

export interface ConversationContext {
  intent: 'create_invoice' | 'add_stock' | 'check_udhaar' | 'record_payment' | 'adjust_stock'
  draft: InvoiceDraft | StockDraft | PaymentDraft
  retries: number
}

export interface InvoiceDraft {
  customer?: {
    name?: string
    phone?: string
    gstin?: string
    address?: string
  }
  items: InvoiceItemDraft[]
  subtotal: number
  cgst: number
  sgst: number
  igst: number
  total: number
  notes?: string
  is_interstate: boolean
}

export interface InvoiceItemDraft {
  name?: string
  hsn_code?: string
  quantity?: number
  unit: string
  rate?: number
  amount?: number
  gst_rate?: number
}

export interface StockDraft {
  product_id?: string
  quantity?: number
  movement_type?: 'in' | 'out' | 'adjustment'
  notes?: string
}

export interface PaymentDraft {
  customer_id?: string
  invoice_id?: string
  amount?: number
  payment_mode?: 'upi' | 'cash' | 'bank' | 'credit' | 'other'
  upi_reference?: string
  notes?: string
}

// Redis utility functions
export const getConversationStateKey = (phoneNumber: string): string => {
  return `whatsapp:state:${phoneNumber}`
}

export const getConversationStateTTL = (): number => {
  return 30 * 60 // 30 minutes in seconds
}

// Example state transitions:
// 1. Invoice Creation Flow:
//    - Start: awaiting_customer_name → awaiting_items → await_item_name → await_item_quantity → await_item_rate → await_add_more_items → await_confirm_invoice → await_send_invoice → completed
//
// 2. Stock Addition Flow:
//    - Start: awaiting_stock_product → awaiting_stock_quantity → awaiting_stock_type → completed
//
// 3. Payment Recording Flow:
//    - Start: await_customer_phone → await_transaction_amount → await_payment_mode → await_upi_reference (if UPI) → completed