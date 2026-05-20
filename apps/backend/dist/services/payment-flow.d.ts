export interface PaymentFlowState {
    lastPayment: string;
}
export declare function handlePaymentFlow(fromNumber: string, message: string, entities: any, currentState: any, business: any): Promise<{
    state: any;
}>;
