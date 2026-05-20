export interface ReportFlowState {
    lastReportRequested: string;
}
export declare function handleReportFlow(fromNumber: string, currentState: any, business: any): Promise<{
    state: any;
}>;
