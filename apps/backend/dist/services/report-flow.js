"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleReportFlow = handleReportFlow;
const supabase_1 = require("../plugins/supabase");
const whatsapp_1 = require("./whatsapp");
async function handleReportFlow(fromNumber, currentState, business) {
    const state = currentState || {};
    if (!state.reportFlow) {
        state.reportFlow = { lastReportRequested: new Date().toISOString() };
    }
    let responseMessage = '';
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.toISOString();
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        const todayEndISO = todayEnd.toISOString();
        // Today's sales
        const { data: invoices } = await supabase_1.supabase
            .from('invoices')
            .select('total, status')
            .eq('business_id', business.id)
            .gte('created_at', todayStart)
            .lte('created_at', todayEndISO);
        const todaySalesTotal = (invoices || []).reduce((sum, inv) => sum + (inv.total || 0), 0);
        // Pending udhaar (unpaid/partial invoices)
        const { data: pendingInvoices } = await supabase_1.supabase
            .from('invoices')
            .select('id, total, payment_received, status')
            .eq('business_id', business.id)
            .in('status', ['sent', 'partial']);
        const pendingOutstanding = (pendingInvoices || []).reduce((sum, inv) => {
            const paid = inv.payment_received || 0;
            return sum + Math.max(0, (inv.total || 0) - paid);
        }, 0);
        // Low stock items
        const { data: products } = await supabase_1.supabase
            .from('products')
            .select('name, stock_quantity, low_stock_alert_at, unit')
            .eq('business_id', business.id);
        const lowStockItems = (products || []).filter((p) => (p.stock_quantity || 0) <= (p.low_stock_alert_at || 0));
        responseMessage = '📊 *Aaj ki report*\n\n';
        responseMessage += `💰 Aaj ki sales: ₹${todaySalesTotal.toFixed(2)}\n`;
        responseMessage += `📧 Pending udhaar: ${pendingInvoices?.length || 0} invoices (₹${pendingOutstanding.toFixed(2)})\n`;
        responseMessage += `📦 Low stock items: ${lowStockItems.length}\n`;
        if (lowStockItems.length > 0) {
            responseMessage += '\n*Low stock details:*\n';
            for (const item of lowStockItems) {
                responseMessage += `• ${item.name}: ${item.stock_quantity} ${item.unit || ''}\n`;
            }
        }
        responseMessage +=
            "\nKisi aur report ke liye batayein (e.g., 'pichli mahine ki report')";
    }
    catch (error) {
        console.error('Error generating report:', error);
        responseMessage =
            'Maaf kijiye, report generate karne mein problem hui. Kripya dobara try karein.';
    }
    await (0, whatsapp_1.sendTextMessage)(fromNumber, responseMessage);
    state.reportFlow.lastReportRequested = new Date().toISOString();
    return { state };
}
