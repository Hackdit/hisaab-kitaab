import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { amountInWords } from '@hisab-kitaab/gst'
import type { SimpleInvoicePDFData } from './types'

const MARGIN = 40
const COL_W = 595.28 - 2 * MARGIN

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
})

interface SimpleInvoiceProps {
  data: SimpleInvoicePDFData
}

function SimpleInvoiceDocument({ data }: SimpleInvoiceProps) {
  const fmt = (n: number) =>
    `Rs. ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ════════ HEADER ════════ */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.businessName}>{data.businessName}</Text>
            {data.businessAddress && (
              <Text style={styles.businessDetail}>{data.businessAddress}</Text>
            )}
            <Text style={styles.businessDetail}>
              GSTIN: {data.businessGstin || 'N/A'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.taxInvoiceTitle}>TAX INVOICE</Text>
            <Text style={styles.invoiceMeta}>Invoice No: {data.invoiceNumber}</Text>
            <Text style={styles.invoiceMeta}>Date: {data.date}</Text>
          </View>
        </View>

        {/* ════════ BILL TO ════════ */}
        <View style={styles.addressBox}>
          <Text style={styles.addressTitle}>Bill To</Text>
          <Text style={styles.addressText}>{data.customerName}</Text>
        </View>

        {/* ════════ ITEMS TABLE ════════ */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colUnit]}>Unit</Text>
            <Text style={[styles.tableHeaderText, styles.colRate]}>Rate</Text>
            <Text style={[styles.tableHeaderText, styles.colGstPct]}>GST%</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Amount</Text>
          </View>

          {data.items.map((item, i) => {
            const amount = item.quantity * item.rate
            return (
              <View
                key={i}
                style={i % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
              >
                <Text style={[styles.tableCell, styles.colDesc]}>{item.description}</Text>
                <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.colUnit]}>{item.unit}</Text>
                <Text style={[styles.tableCell, styles.colRate]}>{fmt(item.rate)}</Text>
                <Text style={[styles.tableCell, styles.colGstPct]}>{item.gstRate}%</Text>
                <Text style={[styles.tableCell, styles.colTotal]}>{fmt(amount)}</Text>
              </View>
            )
          })}
        </View>

        {/* ════════ TOTALS ════════ */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{fmt(data.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST</Text>
              <Text style={styles.totalValue}>{fmt(data.gstAmount)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL</Text>
              <Text style={styles.grandTotalValue}>{fmt(data.total)}</Text>
            </View>
            <Text style={styles.amountInWords}>{amountInWords(data.total)}</Text>
          </View>
        </View>

        {/* ════════ PAYMENT MODE ════════ */}
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Payment Mode:</Text>
          <Text style={styles.paymentValue}>{data.paymentMode}</Text>
        </View>

        {/* ════════ FOOTER ════════ */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>This is a computer-generated invoice</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generateSimpleInvoicePDF(
  data: SimpleInvoicePDFData
): Promise<Buffer> {
  const { renderToBuffer } = await import('@react-pdf/renderer')
  return renderToBuffer(<SimpleInvoiceDocument data={data} />)
}

export default SimpleInvoiceDocument
