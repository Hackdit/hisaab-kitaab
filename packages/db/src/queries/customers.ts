import { supabase } from '../supabase'

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

export const getOrCreateCustomer = async (
  businessId: string,
  name: string,
  phone?: string
): Promise<Customer> => {
  const { data, error } = await supabase
    .from('customers')
    .upsert({
      business_id: businessId,
      name,
      whatsapp_number: phone,
      last_transaction_at: new Date().toISOString()
    }, {
      onConflict: 'business_id,whatsapp_number'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const getCustomers = async (businessId: string): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const updateCustomerOutstanding = async (
  customerId: string,
  amount: number
): Promise<void> => {
  const { error } = await supabase
    .from('customers')
    .update({
      total_outstanding: amount,
      last_transaction_at: new Date().toISOString()
    })
    .eq('id', customerId)

  if (error) throw error
}