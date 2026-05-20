export interface Customer {
    id: string;
    business_id: string;
    name: string;
    whatsapp_number?: string;
    gstin?: string;
    address?: string;
    total_outstanding: number;
    last_transaction_at?: string;
    created_at: string;
}
export declare const getOrCreateCustomer: (businessId: string, name: string, phone?: string) => Promise<Customer>;
export declare const getCustomers: (businessId: string) => Promise<Customer[]>;
export declare const updateCustomerOutstanding: (customerId: string, amount: number) => Promise<void>;
