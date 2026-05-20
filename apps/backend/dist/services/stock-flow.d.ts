export interface StockFlowState {
    lastUpdated: string;
}
export declare function handleStockFlow(fromNumber: string, message: string, entities: any, currentState: any, business: any): Promise<{
    state: any;
}>;
