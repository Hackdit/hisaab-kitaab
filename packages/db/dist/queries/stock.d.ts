export interface StockMovement {
    id: string;
    business_id?: string;
    product_id: string;
    movement_type: 'in' | 'out' | 'adjustment';
    quantity: number;
    reference_id?: string;
    notes?: string;
    created_at: string;
}
export declare const addStockMovement: (businessId: string, productId: string, quantity: number, type: "in" | "out" | "adjustment", referenceId?: string) => Promise<StockMovement>;
export declare const getStockMovements: (businessId: string, productId?: string) => Promise<StockMovement[]>;
