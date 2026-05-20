import type { InvoicePDFData } from './types';
interface InvoiceProps {
    data: InvoicePDFData;
    qrDataUrl?: string;
}
declare function InvoiceDocument({ data, qrDataUrl }: InvoiceProps): import("react/jsx-runtime").JSX.Element;
/**
 * Generate a PDF buffer from invoice data.
 *
 * @param data   Fully computed invoice data (GST already calculated)
 * @returns      Promise resolving to a Buffer of the PDF
 */
export declare function generateInvoicePDF(data: InvoicePDFData): Promise<Buffer>;
export default InvoiceDocument;
//# sourceMappingURL=invoice.d.ts.map