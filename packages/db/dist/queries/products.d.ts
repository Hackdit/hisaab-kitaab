export interface Product {
    id: string;
    business_id: string;
    name: string;
    hsn_code?: string;
    unit: string;
    selling_price?: number;
    cost_price?: number;
    gst_rate: number;
    stock_quantity: number;
    low_stock_alert_at: number;
    created_at: string;
}
export declare const createProduct: (businessId: string, product: Omit<Product, "id" | "business_id" | "created_at">) => Promise<Product>;
export declare const getProducts: (businessId: string) => Promise<Product[]>;
export declare const getLowStockItems: (businessId: string) => Promise<Product[]>;
export declare const updateProductStock: (productId: string, quantity: number, movementType: "in" | "out" | "adjustment") => Promise<void>;
export declare const bulkCreateProducts: (businessId: string, products: Omit<Product, "id" | "business_id" | "created_at">[]) => Promise<Product[]>;
