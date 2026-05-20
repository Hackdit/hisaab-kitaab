import { supabase } from '../supabase';
export const getOrCreateCustomer = async (businessId, name, phone) => {
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
        .single();
    if (error)
        throw error;
    return data;
};
export const getCustomers = async (businessId) => {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data || [];
};
export const updateCustomerOutstanding = async (customerId, amount) => {
    const { error } = await supabase
        .from('customers')
        .update({
        total_outstanding: amount,
        last_transaction_at: new Date().toISOString()
    })
        .eq('id', customerId);
    if (error)
        throw error;
};
//# sourceMappingURL=customers.js.map