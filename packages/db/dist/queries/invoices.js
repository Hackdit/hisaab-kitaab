import { supabase } from '../supabase';
export const createInvoice = async (businessId, invoiceData) => {
    const { data, error } = await supabase
        .from('invoices')
        .insert({
        business_id: businessId,
        ...invoiceData
    })
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
export const getInvoices = async (businessId) => {
    const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data || [];
};
export const getPendingInvoices = async (businessId) => {
    const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('business_id', businessId)
        .in('status', ['unpaid', 'partial']);
    if (error)
        throw error;
    return data || [];
};
export const updateInvoiceStatus = async (businessId, invoiceId, status) => {
    const { error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', invoiceId)
        .eq('business_id', businessId);
    if (error)
        throw error;
};
export const createInvoiceItem = async (invoiceId, itemData) => {
    const { data, error } = await supabase
        .from('invoice_items')
        .insert({
        invoice_id: invoiceId,
        ...itemData
    })
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
export const bulkCreateInvoices = async (businessId, invoices) => {
    const { data, error } = await supabase
        .from('invoices')
        .insert(invoices.map(i => ({ business_id: businessId, ...i })))
        .select();
    if (error)
        throw error;
    return data || [];
};
//# sourceMappingURL=invoices.js.map