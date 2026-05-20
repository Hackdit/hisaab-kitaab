"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoicePDF = generateInvoicePDF;
const jsx_runtime_1 = require("react/jsx-runtime");
const renderer_1 = require("@react-pdf/renderer");
const gst_1 = require("@hisab-kitaab/gst");
const qr_1 = require("./qr");
// Page dimensions in points (A4)
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 40;
const COL_W = PAGE_W - 2 * MARGIN;
const styles = renderer_1.StyleSheet.create({
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
    return ((0, jsx_runtime_1.jsx)(renderer_1.Document, { children: (0, jsx_runtime_1.jsxs)(renderer_1.Page, { size: "A4", style: styles.page, children: [(0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.headerRow, children: [(0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.headerLeft, children: [data.business.logoUrl && (0, jsx_runtime_1.jsx)(renderer_1.Image, { style: styles.logo, src: data.business.logoUrl }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.businessName, children: data.business.name }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.businessDetail, children: data.business.address }), (0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.businessDetail, children: ["GSTIN: ", data.business.gstin || '—'] })] })] }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.headerRight, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.taxInvoiceTitle, children: "TAX INVOICE" }), (0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.invoiceMeta, children: ["Invoice No: ", data.invoice.number] }), (0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.invoiceMeta, children: ["Date: ", data.invoice.date] }), (0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.invoiceMeta, children: ["Due Date: ", data.invoice.dueDate] })] })] }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.addressRow, children: [(0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.addressBox, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.addressTitle, children: "Bill To" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.addressText, children: data.customer.name }), data.customer.address && (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.addressText, children: data.customer.address }), data.customer.gstin && (0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.addressText, children: ["GSTIN: ", data.customer.gstin] })] }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.addressBox, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.addressTitle, children: "Ship To" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.addressText, children: data.customer.name }), data.customer.address && (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.addressText, children: data.customer.address })] })] }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.table, children: [(0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.tableHeader, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableHeaderText, styles.colNo], children: "#" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableHeaderText, styles.colDesc], children: "Description" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableHeaderText, styles.colHSN], children: "HSN" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableHeaderText, styles.colQty], children: "Qty" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableHeaderText, styles.colUnit], children: "Unit" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableHeaderText, styles.colRate], children: "Rate" }), isInterstate ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableHeaderText, styles.colGstPct], children: "IGST%" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableHeaderText, styles.colGstAmt], children: "IGST" })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableHeaderText, styles.colGstPct], children: "CGST" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableHeaderText, styles.colGstAmt], children: "SGST" })] })), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableHeaderText, styles.colTotal], children: "Total" })] }), data.items.map((item, i) => {
                            const amt = item.quantity * item.rate;
                            const gstAmount = amt * item.gstRate / 100;
                            const halfGst = gstAmount / 2;
                            const total = amt + gstAmount;
                            return ((0, jsx_runtime_1.jsxs)(renderer_1.View, { style: i % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : [styles.tableRow], children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableCell, styles.colNo], children: i + 1 }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableCell, styles.colDesc], children: item.name }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableCell, styles.colHSN], children: item.hsnCode || '—' }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableCell, styles.colQty], children: item.quantity }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableCell, styles.colUnit], children: item.unit }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableCell, styles.colRate], children: item.rate.toFixed(2) }), isInterstate ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: [styles.tableCell, styles.colGstPct], children: [item.gstRate, "%"] }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableCell, styles.colGstAmt], children: gstAmount.toFixed(2) })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableCell, styles.colGstPct], children: halfGst.toFixed(2) }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableCell, styles.colGstAmt], children: halfGst.toFixed(2) })] })), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableCell, styles.colTotal], children: total.toFixed(2) })] }, i));
                        })] }), (0, jsx_runtime_1.jsx)(renderer_1.View, { style: styles.totalsSection, children: (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.totalsBox, children: [(0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.totalRow, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.totalLabel, children: "Subtotal" }), (0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.totalValue, children: ["\u20B9", data.subtotal.toFixed(2)] })] }), isInterstate ? ((0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.totalRow, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.totalLabel, children: "IGST (full)" }), (0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.totalValue, children: ["\u20B9", data.igst.toFixed(2)] })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.totalRow, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.totalLabel, children: "CGST (\u00BD)" }), (0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.totalValue, children: ["\u20B9", data.cgst.toFixed(2)] })] }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.totalRow, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.totalLabel, children: "SGST (\u00BD)" }), (0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.totalValue, children: ["\u20B9", data.sgst.toFixed(2)] })] })] })), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.totalRow, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.totalLabel, children: "Round off" }), (0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.totalValue, children: ["\u20B9", data.roundOff.toFixed(2)] })] }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.grandTotalRow, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.grandTotalLabel, children: "TOTAL" }), (0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.grandTotalValue, children: ["\u20B9", data.grandTotal.toFixed(2)] })] }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.amountInWords, children: (0, gst_1.amountInWords)(data.grandTotal) })] }) }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.footer, children: [(0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.footerRow, children: [(0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.footerBank, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.footerTitle, children: "Bank Details" }), data.business.bankAccount && ((0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.footerText, children: ["A/c: ", data.business.bankAccount] })), data.business.bankIfsc && ((0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.footerText, children: ["IFSC: ", data.business.bankIfsc] })), data.business.bankName && ((0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.footerText, children: ["Bank: ", data.business.bankName] }))] }), hasQR && ((0, jsx_runtime_1.jsxs)(renderer_1.View, { children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.footerTitle, children: "Pay via UPI" }), (0, jsx_runtime_1.jsx)(renderer_1.Image, { style: styles.footerQr, src: qrDataUrl })] })), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.footerBank, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.footerTitle, children: "Terms" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.footerText, children: data.terms || 'Payment due within 30 days' }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.footerText, { marginTop: 4 }], children: "This is a computer-generated invoice" })] })] }), (0, jsx_runtime_1.jsx)(renderer_1.View, { style: styles.signatureRow, children: (0, jsx_runtime_1.jsxs)(renderer_1.View, { children: [(0, jsx_runtime_1.jsx)(renderer_1.View, { style: styles.signatureBox }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.signatureLabel, children: "Authorised Signatory" })] }) })] })] }) }));
}
/**
 * Generate a PDF buffer from invoice data.
 *
 * @param data   Fully computed invoice data (GST already calculated)
 * @returns      Promise resolving to a Buffer of the PDF
 */
async function generateInvoicePDF(data) {
    const { renderToBuffer } = await Promise.resolve().then(() => __importStar(require('@react-pdf/renderer')));
    const qrDataUrl = data.business.upiId
        ? await (0, qr_1.generateUPIQR)(data.business.upiId, data.business.name, data.grandTotal)
        : undefined;
    return renderToBuffer((0, jsx_runtime_1.jsx)(InvoiceDocument, { data: data, qrDataUrl: qrDataUrl }));
}
exports.default = InvoiceDocument;
//# sourceMappingURL=invoice.js.map