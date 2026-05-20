import { supabase } from './supabase'

// Types
export interface Business {
  id: string
  whatsapp_number: string
  owner_name?: string
  business_name?: string
  gstin?: string
  address?: string
  state_code?: string
  logo_url?: string
  plan: 'trial' | 'chhota' | 'vyapari' | 'dhanda' | 'ca'
  trial_ends_at?: string
  razorpay_subscription_id?: string
  language: 'hi' | 'ta' | 'te' | 'bn' | 'kn' | 'en'
  onboarded_at?: string
  created_at: string
}

export interface Customer {
  id: string
  business_id: string
  name: string
  whatsapp_number?: string
  gstin?: string
  address?: string
  total_outstanding: number
  last_transaction_at?: string
  created_at: string
}

export interface Product {
  id: string
  business_id: string
  name: string
  hsn_code?: string
  unit: string
  selling_price?: number
  cost_price?: number
  gst_rate: number
  stock_quantity: number
  low_stock_alert_at: number
  created_at: string
}

export interface Invoice {
  id: string
  business_id: string
  customer_id?: string
  invoice_number: string
  invoice_date: string
  due_date?: string
  subtotal: number
  cgst: number
  sgst: number
  igst: number
  total: number
  is_interstate: boolean
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'cancelled'
  pdf_url?: string
  whatsapp_sent_at?: string
  notes?: string
  created_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  product_id?: string
  description: string
  hsn_code?: string
  quantity: number
  unit: string
  rate: number
  gst_rate: number
  amount: number
}

export interface Transaction {
  id: string
  business_id: string
  customer_id?: string
  invoice_id?: string
  type: 'payment_in' | 'payment_out' | 'udhaar' | 'adjustment'
  amount: number
  payment_mode?: 'upi' | 'cash' | 'bank' | 'credit' | 'other'
  upi_reference?: string
  notes?: string
  transaction_date: string
  created_at: string
}

export interface StockMovement {
  id: string
  business_id?: string
  product_id: string
  movement_type: 'in' | 'out' | 'adjustment'
  quantity: number
  reference_id?: string
  notes?: string
  created_at: string
}

// Utility functions
export const getBusinessId = async (): Promise<string> => {
  const { data } = await supabase.auth.getSession()
  return data?.session?.user?.id || ''
}

// Re-export all query functions
export * from './queries'



// Helper functions for GST calculations
export const calculateGST = (
  amount: number,
  gstRate: number,
  isInterstate: boolean = false
) => {
  const taxableAmount = amount / (1 + gstRate / 100)
  const gstAmount = amount - taxableAmount

  if (isInterstate) {
    return {
      subtotal: taxableAmount,
      igst: gstAmount,
      cgst: 0,
      sgst: 0
    }
  } else {
    const halfGst = gstAmount / 2
    return {
      subtotal: taxableAmount,
      cgst: halfGst,
      sgst: halfGst,
      igst: 0
    }
  }
}

