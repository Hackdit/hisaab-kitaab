import { supabase } from '../supabase'

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

export const createProduct = async (
  businessId: string,
  product: Omit<Product, 'id' | 'business_id' | 'created_at'>
): Promise<Product> => {
  const { data, error } = await supabase
    .from('products')
    .insert({
      business_id: businessId,
      ...product
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const getProducts = async (businessId: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', businessId)

  if (error) throw error
  return data || []
}

export const getLowStockItems = async (businessId: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', businessId)
    .lt('stock_quantity', 'low_stock_alert_at')

  if (error) throw error
  return data || []
}

export const updateProductStock = async (
  productId: string,
  quantity: number,
  movementType: 'in' | 'out' | 'adjustment'
): Promise<void> => {
  const { error } = await supabase.rpc('update_product_stock', {
    p_product_id: productId,
    p_quantity: quantity,
    p_movement_type: movementType
  })

  if (error) throw error
}

export const bulkCreateProducts = async (
  businessId: string,
  products: Omit<Product, 'id' | 'business_id' | 'created_at'>[]
): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .insert(products.map(p => ({ business_id: businessId, ...p })))
    .select()

  if (error) throw error
  return data || []
}