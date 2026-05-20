export interface Invoice {
    id: string;
    business_id: string;
    customer_id?: string;
    invoice_number: string;
    invoice_date: string;
    due_date?: string;
    subtotal: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
    is_interstate: boolean;
    status: 'draft' | 'sent' | 'paid' | 'partial' | 'cancelled';
    pdf_url?: string;
    whatsapp_sent_at?: string;
    notes?: string;
    created_at: string;
}
export interface InvoiceItem {
    id: string;
    invoice_id: string;
    product_id?: string;
    description: string;
    hsn_code?: string;
    quantity: number;
    unit: string;
    rate: number;
    gst_rate: number;
    amount: number;
}
export declare const createInvoice: (businessId: string, invoiceData: Omit<Invoice, "id" | "business_id" | "created_at">) => Promise<Invoice>;
export declare const getInvoices: (businessId: string) => Promise<Invoice[]>;
export declare const getPendingInvoices: (businessId: string) => Promise<Invoice[]>;
export declare const updateInvoiceStatus: (businessId: string, invoiceId: string, status: Invoice["status"]) => Promise<void>;
export declare const createInvoiceItem: (invoiceId: string, itemData: Omit<InvoiceItem, "id" | "invoice_id">) => Promise<InvoiceItem>;
export declare const bulkCreateInvoices: (businessId: string, invoices: Omit<Invoice, "id" | "business_id" | "created_at">[]) => Promise<Invoice[]>;
