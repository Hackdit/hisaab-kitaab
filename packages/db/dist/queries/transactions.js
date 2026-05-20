import { supabase } from '../supabase';
export const recordTransaction = async (businessId, transactionData) => {
    const { data, error } = await supabase
        .from('transactions')
        .insert({
        business_id: businessId,
        ...transactionData
    })
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
export const getTransactions = async (businessId) => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('business_id', businessId)
        .order('transaction_date', { ascending: false });
    if (error)
        throw error;
    return data || [];
};
export const getMonthlyTransactions = async (businessId, month, year) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('business_id', businessId)
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', endDate.toISOString());
    if (error)
        throw error;
    return data || [];
};
export const getUdhaarSummary = async (businessId) => {
    const { data, error } = await supabase
        .from('transactions')
        .select('customer_id, amount')
        .eq('business_id', businessId)
        .eq('type', 'udhaar')
        .order('transaction_date', { ascending: false });
    if (error)
        throw error;
    // Group by customer
    const summary = {};
    data?.forEach(transaction => {
        if (transaction.customer_id) {
            if (!summary[transaction.customer_id]) {
                summary[transaction.customer_id] = { total: 0, transactions: 0 };
            }
            summary[transaction.customer_id].total += transaction.amount;
            summary[transaction.customer_id].transactions += 1;
        }
    });
    return summary;
};
//# sourceMappingURL=transactions.js.map