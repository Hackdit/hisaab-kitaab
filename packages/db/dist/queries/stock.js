import { supabase } from '../supabase';
export const addStockMovement = async (businessId, productId, quantity, type, referenceId) => {
    // Update product stock first
    const { error: updateError } = await supabase.rpc('update_product_stock', {
        p_product_id: productId,
        p_quantity: quantity,
        p_movement_type: type
    });
    if (updateError)
        throw updateError;
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
        .single();
    if (error)
        throw error;
    return data;
};
export const getStockMovements = async (businessId, productId) => {
    let query = supabase
        .from('stock_movements')
        .select('*')
        .eq('business_id', businessId);
    if (productId) {
        query = query.eq('product_id', productId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error)
        throw error;
    return data || [];
};
//# sourceMappingURL=stock.js.map