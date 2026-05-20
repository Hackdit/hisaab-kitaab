import { supabase } from '../supabase';
export const createProduct = async (businessId, product) => {
    const { data, error } = await supabase
        .from('products')
        .insert({
        business_id: businessId,
        ...product
    })
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
export const getProducts = async (businessId) => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', businessId);
    if (error)
        throw error;
    return data || [];
};
export const getLowStockItems = async (businessId) => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', businessId)
        .lt('stock_quantity', 'low_stock_alert_at');
    if (error)
        throw error;
    return data || [];
};
export const updateProductStock = async (productId, quantity, movementType) => {
    const { error } = await supabase.rpc('update_product_stock', {
        p_product_id: productId,
        p_quantity: quantity,
        p_movement_type: movementType
    });
    if (error)
        throw error;
};
export const bulkCreateProducts = async (businessId, products) => {
    const { data, error } = await supabase
        .from('products')
        .insert(products.map(p => ({ business_id: businessId, ...p })))
        .select();
    if (error)
        throw error;
    return data || [];
};
//# sourceMappingURL=products.js.map