import { supabase } from './supabase';
// Utility functions
export const getBusinessId = async () => {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.id || '';
};
// Re-export all query functions
export * from './queries';
// Helper functions for GST calculations
export const calculateGST = (amount, gstRate, isInterstate = false) => {
    const taxableAmount = amount / (1 + gstRate / 100);
    const gstAmount = amount - taxableAmount;
    if (isInterstate) {
        return {
            subtotal: taxableAmount,
            igst: gstAmount,
            cgst: 0,
            sgst: 0
        };
    }
    else {
        const halfGst = gstAmount / 2;
        return {
            subtotal: taxableAmount,
            cgst: halfGst,
            sgst: halfGst,
            igst: 0
        };
    }
};
//# sourceMappingURL=index.js.map