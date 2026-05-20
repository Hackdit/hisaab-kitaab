import { supabase } from '../supabase'

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

export const addStockMovement = async (
  businessId: string,
  productId: string,
  quantity: number,
  type: 'in' | 'out' | 'adjustment',
  referenceId?: string
): Promise<StockMovement> => {
  // Update product stock first
  const { error: updateError } = await supabase.rpc('update_product_stock', {
    p_product_id: productId,
    p_quantity: quantity,
    p_movement_type: type
  })

  if (updateError) throw updateError

  // Record the movement
  const { data, error } = await supabase
    .from('stock_movements')
    .insert({
      business_id: businessId,
      product_id: productId,
      movement_type: type,
      quantity,
      reference_id: referenceId
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const getStockMovements = async (
  businessId: string,
  productId?: string
): Promise<StockMovement[]> => {
  let query = supabase
    .from('stock_movements')
    .select('*')
    .eq('business_id', businessId)

  if (productId) {
    query = query.eq('product_id', productId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}