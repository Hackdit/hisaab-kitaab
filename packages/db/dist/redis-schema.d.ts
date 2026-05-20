export interface ConversationState {
    step: ConversationStep;
    context: ConversationContext;
    business_id: string;
    language: 'hi' | 'ta' | 'te' | 'bn' | 'kn' | 'en';
}
export type ConversationStep = 'awaiting_customer_name' | 'awaiting_customer_phone' | 'awaiting_customer_gstin' | 'awaiting_customer_address' | 'awaiting_items' | 'awaiting_item_name' | 'awaiting_item_hsn' | 'awaiting_item_quantity' | 'awaiting_item_rate' | 'awaiting_confirm_invoice' | 'awaiting_payment_mode' | 'awaiting_upi_reference' | 'awaiting_transaction_amount' | 'awaiting_adjustment_reason' | 'awaiting_stock_product' | 'awaiting_stock_quantity' | 'awaiting_stock_type' | 'awaiting_add_more_items' | 'awaiting_send_invoice' | 'completed';
export interface ConversationContext {
    intent: 'create_invoice' | 'add_stock' | 'check_udhaar' | 'record_payment' | 'adjust_stock';
    draft: InvoiceDraft | StockDraft | PaymentDraft;
    retries: number;
}
export interface InvoiceDraft {
    customer?: {
        name?: string;
        phone?: string;
        gstin?: string;
        address?: string;
    };
    items: InvoiceItemDraft[];
    subtotal: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
    notes?: string;
    is_interstate: boolean;
}
export interface InvoiceItemDraft {
    name?: string;
    hsn_code?: string;
    quantity?: number;
    unit: string;
    rate?: number;
    amount?: number;
    gst_rate?: number;
}
export interface StockDraft {
    product_id?: string;
    quantity?: number;
    movement_type?: 'in' | 'out' | 'adjustment';
    notes?: string;
}
export interface PaymentDraft {
    customer_id?: string;
    invoice_id?: string;
    amount?: number;
    payment_mode?: 'upi' | 'cash' | 'bank' | 'credit' | 'other';
    upi_reference?: string;
    notes?: string;
}
export declare const getConversationStateKey: (phoneNumber: string) => string;
export declare const getConversationStateTTL: () => number;
