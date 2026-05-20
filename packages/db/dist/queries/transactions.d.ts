export interface Transaction {
    id: string;
    business_id: string;
    customer_id?: string;
    invoice_id?: string;
    type: 'payment_in' | 'payment_out' | 'udhaar' | 'adjustment';
    amount: number;
    payment_mode?: 'upi' | 'cash' | 'bank' | 'credit' | 'other';
    upi_reference?: string;
    notes?: string;
    transaction_date: string;
    created_at: string;
}
export declare const recordTransaction: (businessId: string, transactionData: Omit<Transaction, "id" | "business_id" | "created_at">) => Promise<Transaction>;
export declare const getTransactions: (businessId: string) => Promise<Transaction[]>;
export declare const getMonthlyTransactions: (businessId: string, month: number, year: number) => Promise<Transaction[]>;
export declare const getUdhaarSummary: (businessId: string) => Promise<{
    [customerId: string]: {
        total: number;
        transactions: number;
    };
}>;
