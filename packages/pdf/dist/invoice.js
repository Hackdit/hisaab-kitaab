import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { amountInWords } from '@hisab-kitaab/gst';
import { generateUPIQR } from './qr';
// Page dimensions in points (A4)
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 40;
const COL_W = PAGE_W - 2 * MARGIN;
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
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logo: {
        width: 48,
        height: 48,
        objectFit: 'contain',
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
    // ── Address Row ──
    addressRow: {
        flexDirection: 'row',
        marginBottom: 10,
        gap: 10,
    },
    addressBox: {
        flex: 1,
        padding: 8,
        border: '1 solid #ccc',
        borderRadius: 2,
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
    // Column widths
    colNo: { width: '5%' },
    colDesc: { width: '22%' },
    colHSN: { width: '10%' },
    colQty: { width: '8%' },
    colUnit: { width: '7%' },
    colRate: { width: '9%' },
    colGstPct: { width: '7%' },
    colGstAmt: { width: '8%' },
    colTotal: { width: '9%' },
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
    // ── Footer ──
    footer: {
        borderTop: '1 solid #ccc',
        paddingTop: 8,
        marginTop: 'auto',
    },
    footerRow: {
        flexDirection: 'row',
        gap: 10,
    },
    footerBank: {
        flex: 1,
    },
    footerQr: {
        width: 80,
        height: 80,
    },
    footerTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        marginBottom: 3,
        color: '#1a237e',
    },
    footerText: {
        fontSize: 6,
        color: '#666',
        lineHeight: 1.4,
    },
    signatureRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingTop: 8,
        borderTop: '1 dashed #ccc',
    },
    signatureBox: {
        width: 120,
        height: 30,
        borderBottom: '1 solid #ccc',
    },
    signatureLabel: {
        fontSize: 7,
        color: '#888',
        marginTop: 2,
    },
});
function InvoiceDocument({ data, qrDataUrl }) {
    const isInterstate = data.isInterstate;
    const hasQR = !!qrDataUrl;
    return (_jsx(Document, { children: _jsxs(Page, { size: "A4", style: styles.page, children: [_jsxs(View, { style: styles.headerRow, children: [_jsxs(View, { style: styles.headerLeft, children: [data.business.logoUrl && _jsx(Image, { style: styles.logo, src: data.business.logoUrl }), _jsxs(View, { children: [_jsx(Text, { style: styles.businessName, children: data.business.name }), _jsx(Text, { style: styles.businessDetail, children: data.business.address }), _jsxs(Text, { style: styles.businessDetail, children: ["GSTIN: ", data.business.gstin || '—'] })] })] }), _jsxs(View, { style: styles.headerRight, children: [_jsx(Text, { style: styles.taxInvoiceTitle, children: "TAX INVOICE" }), _jsxs(Text, { style: styles.invoiceMeta, children: ["Invoice No: ", data.invoice.number] }), _jsxs(Text, { style: styles.invoiceMeta, children: ["Date: ", data.invoice.date] }), _jsxs(Text, { style: styles.invoiceMeta, children: ["Due Date: ", data.invoice.dueDate] })] })] }), _jsxs(View, { style: styles.addressRow, children: [_jsxs(View, { style: styles.addressBox, children: [_jsx(Text, { style: styles.addressTitle, children: "Bill To" }), _jsx(Text, { style: styles.addressText, children: data.customer.name }), data.customer.address && _jsx(Text, { style: styles.addressText, children: data.customer.address }), data.customer.gstin && _jsxs(Text, { style: styles.addressText, children: ["GSTIN: ", data.customer.gstin] })] }), _jsxs(View, { style: styles.addressBox, children: [_jsx(Text, { style: styles.addressTitle, children: "Ship To" }), _jsx(Text, { style: styles.addressText, children: data.customer.name }), data.customer.address && _jsx(Text, { style: styles.addressText, children: data.customer.address })] })] }), _jsxs(View, { style: styles.table, children: [_jsxs(View, { style: styles.tableHeader, children: [_jsx(Text, { style: [styles.tableHeaderText, styles.colNo], children: "#" }), _jsx(Text, { style: [styles.tableHeaderText, styles.colDesc], children: "Description" }), _jsx(Text, { style: [styles.tableHeaderText, styles.colHSN], children: "HSN" }), _jsx(Text, { style: [styles.tableHeaderText, styles.colQty], children: "Qty" }), _jsx(Text, { style: [styles.tableHeaderText, styles.colUnit], children: "Unit" }), _jsx(Text, { style: [styles.tableHeaderText, styles.colRate], children: "Rate" }), isInterstate ? (_jsxs(_Fragment, { children: [_jsx(Text, { style: [styles.tableHeaderText, styles.colGstPct], children: "IGST%" }), _jsx(Text, { style: [styles.tableHeaderText, styles.colGstAmt], children: "IGST" })] })) : (_jsxs(_Fragment, { children: [_jsx(Text, { style: [styles.tableHeaderText, styles.colGstPct], children: "CGST" }), _jsx(Text, { style: [styles.tableHeaderText, styles.colGstAmt], children: "SGST" })] })), _jsx(Text, { style: [styles.tableHeaderText, styles.colTotal], children: "Total" })] }), data.items.map((item, i) => {
                            const amt = item.quantity * item.rate;
                            const gstAmount = amt * item.gstRate / 100;
                            const halfGst = gstAmount / 2;
                            const total = amt + gstAmount;
                            return (_jsxs(View, { style: i % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : [styles.tableRow], children: [_jsx(Text, { style: [styles.tableCell, styles.colNo], children: i + 1 }), _jsx(Text, { style: [styles.tableCell, styles.colDesc], children: item.name }), _jsx(Text, { style: [styles.tableCell, styles.colHSN], children: item.hsnCode || '—' }), _jsx(Text, { style: [styles.tableCell, styles.colQty], children: item.quantity }), _jsx(Text, { style: [styles.tableCell, styles.colUnit], children: item.unit }), _jsx(Text, { style: [styles.tableCell, styles.colRate], children: item.rate.toFixed(2) }), isInterstate ? (_jsxs(_Fragment, { children: [_jsxs(Text, { style: [styles.tableCell, styles.colGstPct], children: [item.gstRate, "%"] }), _jsx(Text, { style: [styles.tableCell, styles.colGstAmt], children: gstAmount.toFixed(2) })] })) : (_jsxs(_Fragment, { children: [_jsx(Text, { style: [styles.tableCell, styles.colGstPct], children: halfGst.toFixed(2) }), _jsx(Text, { style: [styles.tableCell, styles.colGstAmt], children: halfGst.toFixed(2) })] })), _jsx(Text, { style: [styles.tableCell, styles.colTotal], children: total.toFixed(2) })] }, i));
                        })] }), _jsx(View, { style: styles.totalsSection, children: _jsxs(View, { style: styles.totalsBox, children: [_jsxs(View, { style: styles.totalRow, children: [_jsx(Text, { style: styles.totalLabel, children: "Subtotal" }), _jsxs(Text, { style: styles.totalValue, children: ["\u20B9", data.subtotal.toFixed(2)] })] }), isInterstate ? (_jsxs(View, { style: styles.totalRow, children: [_jsx(Text, { style: styles.totalLabel, children: "IGST (full)" }), _jsxs(Text, { style: styles.totalValue, children: ["\u20B9", data.igst.toFixed(2)] })] })) : (_jsxs(_Fragment, { children: [_jsxs(View, { style: styles.totalRow, children: [_jsx(Text, { style: styles.totalLabel, children: "CGST (\u00BD)" }), _jsxs(Text, { style: styles.totalValue, children: ["\u20B9", data.cgst.toFixed(2)] })] }), _jsxs(View, { style: styles.totalRow, children: [_jsx(Text, { style: styles.totalLabel, children: "SGST (\u00BD)" }), _jsxs(Text, { style: styles.totalValue, children: ["\u20B9", data.sgst.toFixed(2)] })] })] })), _jsxs(View, { style: styles.totalRow, children: [_jsx(Text, { style: styles.totalLabel, children: "Round off" }), _jsxs(Text, { style: styles.totalValue, children: ["\u20B9", data.roundOff.toFixed(2)] })] }), _jsxs(View, { style: styles.grandTotalRow, children: [_jsx(Text, { style: styles.grandTotalLabel, children: "TOTAL" }), _jsxs(Text, { style: styles.grandTotalValue, children: ["\u20B9", data.grandTotal.toFixed(2)] })] }), _jsx(Text, { style: styles.amountInWords, children: amountInWords(data.grandTotal) })] }) }), _jsxs(View, { style: styles.footer, children: [_jsxs(View, { style: styles.footerRow, children: [_jsxs(View, { style: styles.footerBank, children: [_jsx(Text, { style: styles.footerTitle, children: "Bank Details" }), data.business.bankAccount && (_jsxs(Text, { style: styles.footerText, children: ["A/c: ", data.business.bankAccount] })), data.business.bankIfsc && (_jsxs(Text, { style: styles.footerText, children: ["IFSC: ", data.business.bankIfsc] })), data.business.bankName && (_jsxs(Text, { style: styles.footerText, children: ["Bank: ", data.business.bankName] }))] }), hasQR && (_jsxs(View, { children: [_jsx(Text, { style: styles.footerTitle, children: "Pay via UPI" }), _jsx(Image, { style: styles.footerQr, src: qrDataUrl })] })), _jsxs(View, { style: styles.footerBank, children: [_jsx(Text, { style: styles.footerTitle, children: "Terms" }), _jsx(Text, { style: styles.footerText, children: data.terms || 'Payment due within 30 days' }), _jsx(Text, { style: [styles.footerText, { marginTop: 4 }], children: "This is a computer-generated invoice" })] })] }), _jsx(View, { style: styles.signatureRow, children: _jsxs(View, { children: [_jsx(View, { style: styles.signatureBox }), _jsx(Text, { style: styles.signatureLabel, children: "Authorised Signatory" })] }) })] })] }) }));
}
/**
 * Generate a PDF buffer from invoice data.
 *
 * @param data   Fully computed invoice data (GST already calculated)
 * @returns      Promise resolving to a Buffer of the PDF
 */
export async function generateInvoicePDF(data) {
    const { renderToBuffer } = await import('@react-pdf/renderer');
    const qrDataUrl = data.business.upiId
        ? await generateUPIQR(data.business.upiId, data.business.name, data.grandTotal)
        : undefined;
    return renderToBuffer(_jsx(InvoiceDocument, { data: data, qrDataUrl: qrDataUrl }));
}
export default InvoiceDocument;
//# sourceMappingURL=invoice.js.map