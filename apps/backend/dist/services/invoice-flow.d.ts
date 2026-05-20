export interface InvoiceFlowState {
    step: 'start' | 'customer' | 'items' | 'pending_item_price' | 'confirmation';
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
}
export declare function initializeInvoiceState(): InvoiceFlowState;
export declare function handleInvoiceFlow(fromNumber: string, message: string, entities: any, currentState: any, business: any): Promise<{
    state: any;
}>;
