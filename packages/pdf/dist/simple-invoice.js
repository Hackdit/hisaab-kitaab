import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { amountInWords } from '@hisab-kitaab/gst';
const MARGIN = 40;
const COL_W = 595.28 - 2 * MARGIN;
const styles = StyleSheet.create({
    page: {
        padding: MARGIN,
        fontSize: 8,
        fontFamily: 'Helvetica',
        color: '#222',
    },
    // ── Header ──
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingBottom: 10,
        borderBottom: '2 solid #1a237e',
    },
    businessName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a237e',
    },
    businessDetail: {
        fontSize: 7,
        color: '#555',
        marginTop: 2,
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    taxInvoiceTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1a237e',
        marginBottom: 4,
    },
    invoiceMeta: {
        fontSize: 7,
        color: '#333',
        marginTop: 1,
    },
    // ── Bill To ──
    addressBox: {
        padding: 8,
        border: '1 solid #ccc',
        borderRadius: 2,
        marginBottom: 10,
    },
    addressTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#1a237e',
    },
    addressText: {
        fontSize: 7,
        lineHeight: 1.4,
        color: '#333',
    },
    // ── Items Table ──
    table: {
        border: '1 solid #ccc',
        marginBottom: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1a237e',
        padding: '5 4',
    },
    tableHeaderText: {
        fontSize: 7,
        fontWeight: 'bold',
        color: '#fff',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1 solid #eee',
        padding: '4 4',
    },
    tableRowAlt: {
        backgroundColor: '#f8f9fa',
    },
    tableCell: {
        fontSize: 7,
        color: '#333',
    },
    colDesc: { width: '30%' },
    colQty: { width: '12%' },
    colUnit: { width: '10%' },
    colRate: { width: '15%' },
    colGstPct: { width: '12%' },
    colTotal: { width: '15%' },
    // ── Totals ──
    totalsSection: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 10,
    },
    totalsBox: {
        width: '50%',
        border: '1 solid #ccc',
        padding: 8,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 2,
        fontSize: 8,
    },
    totalLabel: { color: '#555' },
    totalValue: { fontWeight: 'bold' },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTop: '2 solid #1a237e',
        paddingTop: 4,
        marginTop: 4,
    },
    grandTotalLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1a237e',
    },
    grandTotalValue: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1a237e',
    },
    amountInWords: {
        fontSize: 7,
        color: '#555',
        marginTop: 4,
        fontStyle: 'italic',
    },
    // ── Payment Mode ──
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 10,
        padding: 6,
        backgroundColor: '#f0f4ff',
        border: '1 solid #d0d8f0',
        borderRadius: 2,
    },
    paymentLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#1a237e',
    },
    paymentValue: {
        fontSize: 8,
        color: '#333',
        marginLeft: 4,
    },
    // ── Footer ──
    footer: {
        borderTop: '1 solid #ccc',
        paddingTop: 8,
        marginTop: 'auto',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 6,
        color: '#888',
        fontStyle: 'italic',
    },
});
function SimpleInvoiceDocument({ data }) {
    const fmt = (n) => `Rs. ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return (_jsx(Document, { children: _jsxs(Page, { size: "A4", style: styles.page, children: [_jsxs(View, { style: styles.headerRow, children: [_jsxs(View, { children: [_jsx(Text, { style: styles.businessName, children: data.businessName }), data.businessAddress && (_jsx(Text, { style: styles.businessDetail, children: data.businessAddress })), _jsxs(Text, { style: styles.businessDetail, children: ["GSTIN: ", data.businessGstin || 'N/A'] })] }), _jsxs(View, { style: styles.headerRight, children: [_jsx(Text, { style: styles.taxInvoiceTitle, children: "TAX INVOICE" }), _jsxs(Text, { style: styles.invoiceMeta, children: ["Invoice No: ", data.invoiceNumber] }), _jsxs(Text, { style: styles.invoiceMeta, children: ["Date: ", data.date] })] })] }), _jsxs(View, { style: styles.addressBox, children: [_jsx(Text, { style: styles.addressTitle, children: "Bill To" }), _jsx(Text, { style: styles.addressText, children: data.customerName })] }), _jsxs(View, { style: styles.table, children: [_jsxs(View, { style: styles.tableHeader, children: [_jsx(Text, { style: [styles.tableHeaderText, styles.colDesc], children: "Description" }), _jsx(Text, { style: [styles.tableHeaderText, styles.colQty], children: "Qty" }), _jsx(Text, { style: [styles.tableHeaderText, styles.colUnit], children: "Unit" }), _jsx(Text, { style: [styles.tableHeaderText, styles.colRate], children: "Rate" }), _jsx(Text, { style: [styles.tableHeaderText, styles.colGstPct], children: "GST%" }), _jsx(Text, { style: [styles.tableHeaderText, styles.colTotal], children: "Amount" })] }), data.items.map((item, i) => {
                            const amount = item.quantity * item.rate;
                            return (_jsxs(View, { style: i % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow, children: [_jsx(Text, { style: [styles.tableCell, styles.colDesc], children: item.description }), _jsx(Text, { style: [styles.tableCell, styles.colQty], children: item.quantity }), _jsx(Text, { style: [styles.tableCell, styles.colUnit], children: item.unit }), _jsx(Text, { style: [styles.tableCell, styles.colRate], children: fmt(item.rate) }), _jsxs(Text, { style: [styles.tableCell, styles.colGstPct], children: [item.gstRate, "%"] }), _jsx(Text, { style: [styles.tableCell, styles.colTotal], children: fmt(amount) })] }, i));
                        })] }), _jsx(View, { style: styles.totalsSection, children: _jsxs(View, { style: styles.totalsBox, children: [_jsxs(View, { style: styles.totalRow, children: [_jsx(Text, { style: styles.totalLabel, children: "Subtotal" }), _jsx(Text, { style: styles.totalValue, children: fmt(data.subtotal) })] }), _jsxs(View, { style: styles.totalRow, children: [_jsx(Text, { style: styles.totalLabel, children: "GST" }), _jsx(Text, { style: styles.totalValue, children: fmt(data.gstAmount) })] }), _jsxs(View, { style: styles.grandTotalRow, children: [_jsx(Text, { style: styles.grandTotalLabel, children: "TOTAL" }), _jsx(Text, { style: styles.grandTotalValue, children: fmt(data.total) })] }), _jsx(Text, { style: styles.amountInWords, children: amountInWords(data.total) })] }) }), _jsxs(View, { style: styles.paymentRow, children: [_jsx(Text, { style: styles.paymentLabel, children: "Payment Mode:" }), _jsx(Text, { style: styles.paymentValue, children: data.paymentMode })] }), _jsx(View, { style: styles.footer, children: _jsx(Text, { style: styles.footerText, children: "This is a computer-generated invoice" }) })] }) }));
}
export async function generateSimpleInvoicePDF(data) {
    const { renderToBuffer } = await import('@react-pdf/renderer');
    return renderToBuffer(_jsx(SimpleInvoiceDocument, { data: data }));
}
export default SimpleInvoiceDocument;
//# sourceMappingURL=simple-invoice.js.map