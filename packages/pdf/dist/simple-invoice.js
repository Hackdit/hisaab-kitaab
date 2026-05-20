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
exports.generateSimpleInvoicePDF = generateSimpleInvoicePDF;
const jsx_runtime_1 = require("react/jsx-runtime");
const renderer_1 = require("@react-pdf/renderer");
const gst_1 = require("@hisab-kitaab/gst");
const MARGIN = 40;
const COL_W = 595.28 - 2 * MARGIN;
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
    return ((0, jsx_runtime_1.jsx)(renderer_1.Document, { children: (0, jsx_runtime_1.jsxs)(renderer_1.Page, { size: "A4", style: styles.page, children: [(0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.headerRow, children: [(0, jsx_runtime_1.jsxs)(renderer_1.View, { children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.businessName, children: data.businessName }), data.businessAddress && ((0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.businessDetail, children: data.businessAddress })), (0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.businessDetail, children: ["GSTIN: ", data.businessGstin || 'N/A'] })] }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.headerRight, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.taxInvoiceTitle, children: "TAX INVOICE" }), (0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.invoiceMeta, children: ["Invoice No: ", data.invoiceNumber] }), (0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.invoiceMeta, children: ["Date: ", data.date] })] })] }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.addressBox, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.addressTitle, children: "Bill To" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.addressText, children: data.customerName })] }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.table, children: [(0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.tableHeader, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableHeaderText, styles.colDesc], children: "Description" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableHeaderText, styles.colQty], children: "Qty" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableHeaderText, styles.colUnit], children: "Unit" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableHeaderText, styles.colRate], children: "Rate" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableHeaderText, styles.colGstPct], children: "GST%" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableHeaderText, styles.colTotal], children: "Amount" })] }), data.items.map((item, i) => {
                            const amount = item.quantity * item.rate;
                            return ((0, jsx_runtime_1.jsxs)(renderer_1.View, { style: i % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableCell, styles.colDesc], children: item.description }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableCell, styles.colQty], children: item.quantity }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableCell, styles.colUnit], children: item.unit }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableCell, styles.colRate], children: fmt(item.rate) }), (0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: [styles.tableCell, styles.colGstPct], children: [item.gstRate, "%"] }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.tableCell, styles.colTotal], children: fmt(amount) })] }, i));
                        })] }), (0, jsx_runtime_1.jsx)(renderer_1.View, { style: styles.totalsSection, children: (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.totalsBox, children: [(0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.totalRow, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.totalLabel, children: "Subtotal" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.totalValue, children: fmt(data.subtotal) })] }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.totalRow, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.totalLabel, children: "GST" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.totalValue, children: fmt(data.gstAmount) })] }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.grandTotalRow, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.grandTotalLabel, children: "TOTAL" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.grandTotalValue, children: fmt(data.total) })] }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.amountInWords, children: (0, gst_1.amountInWords)(data.total) })] }) }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.paymentRow, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.paymentLabel, children: "Payment Mode:" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.paymentValue, children: data.paymentMode })] }), (0, jsx_runtime_1.jsx)(renderer_1.View, { style: styles.footer, children: (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.footerText, children: "This is a computer-generated invoice" }) })] }) }));
}
async function generateSimpleInvoicePDF(data) {
    const { renderToBuffer } = await Promise.resolve().then(() => __importStar(require('@react-pdf/renderer')));
    return renderToBuffer((0, jsx_runtime_1.jsx)(SimpleInvoiceDocument, { data: data }));
}
exports.default = SimpleInvoiceDocument;
//# sourceMappingURL=simple-invoice.js.map