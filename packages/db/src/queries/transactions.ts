import { supabase } from '../supabase'

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

export const recordTransaction = async (
  businessId: string,
  transactionData: Omit<Transaction, 'id' | 'business_id' | 'created_at'>
): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      business_id: businessId,
      ...transactionData
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const getTransactions = async (businessId: string): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('business_id', businessId)
    .order('transaction_date', { ascending: false })

  if (error) throw error
  return data || []
}

export const getMonthlyTransactions = async (
  businessId: string,
  month: number,
  year: number
): Promise<Transaction[]> => {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('business_id', businessId)
    .gte('transaction_date', startDate.toISOString())
    .lte('transaction_date', endDate.toISOString())

  if (error) throw error
  return data || []
}

export const getUdhaarSummary = async (businessId: string) => {
  const { data, error } = await supabase
    .from('transactions')
    .select('customer_id, amount')
    .eq('business_id', businessId)
    .eq('type', 'udhaar')
    .order('transaction_date', { ascending: false })

  if (error) throw error

  // Group by customer
  const summary: { [customerId: string]: { total: number; transactions: number } } = {}

  data?.forEach(transaction => {
    if (transaction.customer_id) {
      if (!summary[transaction.customer_id]) {
        summary[transaction.customer_id] = { total: 0, transactions: 0 }
      }
      summary[transaction.customer_id].total += transaction.amount
      summary[transaction.customer_id].transactions += 1
    }
  })

  return summary
}