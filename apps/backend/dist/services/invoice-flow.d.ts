export interface InvoiceFlowState {
    active: boolean;
    step: 'start' | 'customer' | 'items' | 'pending_item_price' | 'confirming' | 'payment_mode' | 'asking_phone';
    customerName?: string;
    customerGstin?: string;
    customerState?: string;
    items: Array<{
        name: string;
        quantity: number;
        unit: string;
        price: number | null;
        gstRate?: number;
        hsnCode?: string;
    }>;
    pendingItemIndex?: number;
    lastCreatedInvoiceNumber?: string;
    lastCreatedInvoiceTotal?: number;
    lastCreatedInvoiceItems?: string;
    lastPaymentMode?: string;
    customerId?: string;
}
export declare function initializeInvoiceState(): InvoiceFlowState;
export declare function handleInvoiceFlow(fromNumber: string, message: string, entities: any, currentState: any, business: any): Promise<{
    state: any;
}>;
