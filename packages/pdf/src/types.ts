import { LineItem } from '@hisab-kitaab/gst'

export interface BusinessInfo {
  name: string
  address?: string
  gstin?: string
  stateCode: string
  logoUrl?: string
  bankAccount?: string
  bankIfsc?: string
  bankName?: string
  upiId?: string
}

export interface CustomerInfo {
  name: string
  address?: string
  gstin?: string
  stateCode?: string
}

export interface InvoiceMeta {
  number: string
  date: string
  dueDate: string
}

export interface InvoicePDFData {
  business: BusinessInfo
  customer: CustomerInfo
  invoice: InvoiceMeta
  items: LineItem[]
  isInterstate: boolean
  subtotal: number
  cgst: number
  sgst: number
  igst: number
  totalTax: number
  roundOff: number
  grandTotal: number
  terms?: string
  notes?: string
}

export interface SimpleLineItem {
  description: string
  quantity: number
  unit: string
  rate: number
  gstRate: number
}

export interface SimpleInvoicePDFData {
  businessName: string
  businessAddress?: string
  businessGstin?: string
  customerName: string
  invoiceNumber: string
  date: string
  items: SimpleLineItem[]
  subtotal: number
  gstAmount: number
  total: number
  paymentMode: string
}