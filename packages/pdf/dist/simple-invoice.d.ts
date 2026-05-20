import type { SimpleInvoicePDFData } from './types';
interface SimpleInvoiceProps {
    data: SimpleInvoicePDFData;
}
declare function SimpleInvoiceDocument({ data }: SimpleInvoiceProps): import("react/jsx-runtime").JSX.Element;
export declare function generateSimpleInvoicePDF(data: SimpleInvoicePDFData): Promise<Buffer>;
export default SimpleInvoiceDocument;
//# sourceMappingURL=simple-invoice.d.ts.map