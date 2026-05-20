"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePaymentFlow = handlePaymentFlow;
const supabase_1 = require("../plugins/supabase");
const whatsapp_1 = require("./whatsapp");
async function handlePaymentFlow(fromNumber, message, entities, currentState, business) {
    const state = currentState || {};
    if (!state.paymentFlow) {
        state.paymentFlow = { lastPayment: new Date().toISOString() };
    }
    const customerName = entities.customerName;
    const amount = entities.amount;
    let responseMessage = '';
    if (!customerName || isNaN(amount) || amount <= 0) {
        responseMessage =
            "Kripya sahi customer naam aur rakam bhejiye. Example: 'Ramesh ne ₹500 diye'";
    }
    else {
        try {
            // Find the latest unpaid invoice for this customer
            const { data: invoices } = await supabase_1.supabase
                .from('invoices')
                .select('*')
                .eq('business_id', business.id)
                .eq('customer_name', customerName)
                .in('status', ['sent', 'partial'])
                .order('created_at', { ascending: false })
                .limit(1);
            if (invoices && invoices.length > 0) {
                const invoice = invoices[0];
                const paidSoFar = invoice.payment_received || 0;
                const invoiceTotal = invoice.total || 0;
                const totalPaid = paidSoFar + amount;
                const remainingBalance = Math.max(0, invoiceTotal - totalPaid);
                const newStatus = remainingBalance <= 0 ? 'paid' : 'partial';
                await supabase_1.supabase
                    .from('invoices')
                    .update({
                    status: newStatus,
                    payment_received: totalPaid,
                    updated_at: new Date().toISOString(),
                })
                    .eq('id', invoice.id);
                responseMessage = `${customerName} ka ₹${amount} receive hua ✅. Unka baaki balance: ₹${remainingBalance}`;
            }
            else {
                // No unpaid invoice — record as a standalone payment/udhaar
                await supabase_1.supabase.from('transactions').insert({
                    business_id: business.id,
                    type: 'payment_in',
                    amount,
                    notes: `Payment received from ${customerName}`,
                    transaction_date: new Date().toISOString(),
                });
                responseMessage = `${customerName} se ₹${amount} receive hua ✅.`;
            }
        }
        catch (error) {
            console.error('Error processing payment:', error);
            responseMessage =
                'Maaf kijiye, payment process karne mein problem hui. Kripya dobara try karein.';
        }
    }
    await (0, whatsapp_1.sendTextMessage)(fromNumber, responseMessage);
    return { state };
}
