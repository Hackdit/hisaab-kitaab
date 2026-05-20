import { supabase } from '../supabase'

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

export interface InvoiceWithItems extends Invoice {
  invoice_items: InvoiceItem[]
  customer?: import('../index').Customer
}

export const createInvoice = async (
  businessId: string,
  invoiceData: Omit<Invoice, 'id' | 'business_id' | 'created_at'>
): Promise<Invoice> => {
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      business_id: businessId,
      ...invoiceData
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const createInvoiceWithItems = async (
  businessId: string,
  invoiceData: Omit<Invoice, 'id' | 'business_id' | 'created_at'>,
  items: Omit<InvoiceItem, 'id' | 'invoice_id'>[]
): Promise<InvoiceWithItems> => {
  const invoice = await createInvoice(businessId, invoiceData)

  if (items.length > 0) {
    const { error } = await supabase
      .from('invoice_items')
      .insert(items.map(item => ({ ...item, invoice_id: invoice.id })))

    if (error) throw error
  }

  return { ...invoice, invoice_items: items as InvoiceItem[] }
}

export const getInvoices = async (
  businessId: string,
  includeItems: boolean = false
): Promise<InvoiceWithItems[]> => {
  const query = supabase
    .from('invoices')
    .select(includeItems ? '*, invoice_items(*), customer(*)' : '*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) throw error
  return (data || []) as unknown as InvoiceWithItems[]
}

export const getInvoiceById = async (invoiceId: string): Promise<InvoiceWithItems | null> => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, invoice_items(*), customer(*)')
    .eq('id', invoiceId)
    .single()

  if (error) throw error
  return data as InvoiceWithItems
}

export const getPendingInvoices = async (businessId: string): Promise<Invoice[]> => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('business_id', businessId)
    .in('status', ['sent', 'partial'])

  if (error) throw error
  return data || []
}

export const updateInvoiceStatus = async (
  businessId: string,
  invoiceId: string,
  status: Invoice['status']
): Promise<void> => {
  const { error } = await supabase
    .from('invoices')
    .update({ status })
    .eq('id', invoiceId)
    .eq('business_id', businessId)

  if (error) throw error
}

export const createInvoiceItem = async (
  invoiceId: string,
  itemData: Omit<InvoiceItem, 'id' | 'invoice_id'>
): Promise<InvoiceItem> => {
  const { data, error } = await supabase
    .from('invoice_items')
    .insert({
      invoice_id: invoiceId,
      ...itemData
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const getNextInvoiceSequence = async (businessId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('businesses')
    .select('last_invoice_sequence')
    .eq('id', businessId)
    .single()

  if (error) throw error
  return (data?.last_invoice_sequence ?? 0) + 1
}