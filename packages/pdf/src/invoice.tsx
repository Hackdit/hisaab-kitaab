import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { amountInWords } from '@hisab-kitaab/gst'
import type { InvoicePDFData } from './types'
import { generateUPIQR } from './qr'

// Page dimensions in points (A4)
const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 40
const COL_W = PAGE_W - 2 * MARGIN

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
})

interface InvoiceProps {
  data: InvoicePDFData
  qrDataUrl?: string
}

function InvoiceDocument({ data, qrDataUrl }: InvoiceProps) {
  const isInterstate = data.isInterstate
  const hasQR = !!qrDataUrl

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ════════ HEADER ════════ */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {data.business.logoUrl && <Image style={styles.logo} src={data.business.logoUrl} />}
            <View>
              <Text style={styles.businessName}>{data.business.name}</Text>
              <Text style={styles.businessDetail}>{data.business.address}</Text>
              <Text style={styles.businessDetail}>GSTIN: {data.business.gstin || '—'}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.taxInvoiceTitle}>TAX INVOICE</Text>
            <Text style={styles.invoiceMeta}>Invoice No: {data.invoice.number}</Text>
            <Text style={styles.invoiceMeta}>Date: {data.invoice.date}</Text>
            <Text style={styles.invoiceMeta}>Due Date: {data.invoice.dueDate}</Text>
          </View>
        </View>

        {/* ════════ BILL TO / SHIP TO ════════ */}
        <View style={styles.addressRow}>
          <View style={styles.addressBox}>
            <Text style={styles.addressTitle}>Bill To</Text>
            <Text style={styles.addressText}>{data.customer.name}</Text>
            {data.customer.address && <Text style={styles.addressText}>{data.customer.address}</Text>}
            {data.customer.gstin && <Text style={styles.addressText}>GSTIN: {data.customer.gstin}</Text>}
          </View>
          <View style={styles.addressBox}>
            <Text style={styles.addressTitle}>Ship To</Text>
            <Text style={styles.addressText}>{data.customer.name}</Text>
            {data.customer.address && <Text style={styles.addressText}>{data.customer.address}</Text>}
          </View>
        </View>

        {/* ════════ ITEMS TABLE ════════ */}
        <View style={styles.table}>
          {/* Header row */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colNo]}>#</Text>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.colHSN]}>HSN</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colUnit]}>Unit</Text>
            <Text style={[styles.tableHeaderText, styles.colRate]}>Rate</Text>
            {isInterstate ? (
              <>
                <Text style={[styles.tableHeaderText, styles.colGstPct]}>IGST%</Text>
                <Text style={[styles.tableHeaderText, styles.colGstAmt]}>IGST</Text>
              </>
            ) : (
              <>
                <Text style={[styles.tableHeaderText, styles.colGstPct]}>CGST</Text>
                <Text style={[styles.tableHeaderText, styles.colGstAmt]}>SGST</Text>
              </>
            )}
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
          </View>

          {/* Data rows */}
          {data.items.map((item, i) => {
            const amt = item.quantity * item.rate
            const gstAmount = amt * item.gstRate / 100
            const halfGst = gstAmount / 2
            const total = amt + gstAmount
            return (
              <View key={i} style={i % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : [styles.tableRow]}>
                <Text style={[styles.tableCell, styles.colNo]}>{i + 1}</Text>
                <Text style={[styles.tableCell, styles.colDesc]}>{item.name}</Text>
                <Text style={[styles.tableCell, styles.colHSN]}>{item.hsnCode || '—'}</Text>
                <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.colUnit]}>{item.unit}</Text>
                <Text style={[styles.tableCell, styles.colRate]}>{item.rate.toFixed(2)}</Text>
                {isInterstate ? (
                  <>
                    <Text style={[styles.tableCell, styles.colGstPct]}>{item.gstRate}%</Text>
                    <Text style={[styles.tableCell, styles.colGstAmt]}>{gstAmount.toFixed(2)}</Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.tableCell, styles.colGstPct]}>{halfGst.toFixed(2)}</Text>
                    <Text style={[styles.tableCell, styles.colGstAmt]}>{halfGst.toFixed(2)}</Text>
                  </>
                )}
                <Text style={[styles.tableCell, styles.colTotal]}>{total.toFixed(2)}</Text>
              </View>
            )
          })}
        </View>

        {/* ════════ TOTALS ════════ */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>₹{data.subtotal.toFixed(2)}</Text>
            </View>
            {isInterstate ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>IGST (full)</Text>
                <Text style={styles.totalValue}>₹{data.igst.toFixed(2)}</Text>
              </View>
            ) : (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>CGST (&#189;)</Text>
                  <Text style={styles.totalValue}>₹{data.cgst.toFixed(2)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>SGST (&#189;)</Text>
                  <Text style={styles.totalValue}>₹{data.sgst.toFixed(2)}</Text>
                </View>
              </>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Round off</Text>
              <Text style={styles.totalValue}>₹{data.roundOff.toFixed(2)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL</Text>
              <Text style={styles.grandTotalValue}>₹{data.grandTotal.toFixed(2)}</Text>
            </View>
            <Text style={styles.amountInWords}>
              {amountInWords(data.grandTotal)}
            </Text>
          </View>
        </View>

        {/* ════════ FOOTER ════════ */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <View style={styles.footerBank}>
              <Text style={styles.footerTitle}>Bank Details</Text>
              {data.business.bankAccount && (
                <Text style={styles.footerText}>A/c: {data.business.bankAccount}</Text>
              )}
              {data.business.bankIfsc && (
                <Text style={styles.footerText}>IFSC: {data.business.bankIfsc}</Text>
              )}
              {data.business.bankName && (
                <Text style={styles.footerText}>Bank: {data.business.bankName}</Text>
              )}
            </View>
            {hasQR && (
              <View>
                <Text style={styles.footerTitle}>Pay via UPI</Text>
                <Image style={styles.footerQr} src={qrDataUrl!} />
              </View>
            )}
            <View style={styles.footerBank}>
              <Text style={styles.footerTitle}>Terms</Text>
              <Text style={styles.footerText}>
                {data.terms || 'Payment due within 30 days'}
              </Text>
              <Text style={[styles.footerText, { marginTop: 4 }]}>
                This is a computer-generated invoice
              </Text>
            </View>
          </View>
          <View style={styles.signatureRow}>
            <View>
              <View style={styles.signatureBox} />
              <Text style={styles.signatureLabel}>Authorised Signatory</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

/**
 * Generate a PDF buffer from invoice data.
 *
 * @param data   Fully computed invoice data (GST already calculated)
 * @returns      Promise resolving to a Buffer of the PDF
 */
export async function generateInvoicePDF(data: InvoicePDFData): Promise<Buffer> {
  const { renderToBuffer } = await import('@react-pdf/renderer')
  const qrDataUrl = data.business.upiId
    ? await generateUPIQR(data.business.upiId, data.business.name, data.grandTotal)
    : undefined

  return renderToBuffer(
    <InvoiceDocument data={data} qrDataUrl={qrDataUrl} />
  )
}

export default InvoiceDocument