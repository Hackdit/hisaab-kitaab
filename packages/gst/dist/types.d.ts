/** A single line item on an invoice */
export interface LineItem {
    name: string;
    hsnCode?: string;
    quantity: number;
    unit: string;
    rate: number;
    gstRate: number;
    isExempt?: boolean;
}
/** Per-item tax breakdown */
export interface LineItemTax {
    itemIndex: number;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
}
/** Result of a full GST calculation */
export interface GSTCalculation {
    subtotal: number;
    taxableAmount: number;
    isInterstate: boolean;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    grandTotal: number;
    roundOff: number;
    breakdown: LineItemTax[];
}
/** Input for GSTR-1 generation (Phase 2) */
export interface GSTR1Input {
    gstin: string;
    fp: string;
    invoices: GSTR1Invoice[];
}
export interface GSTR1Invoice {
    invoiceNumber: string;
    invoiceDate: string;
    customerGstin?: string;
    customerName: string;
    customerState: string;
    items: LineItem[];
    isInterstate: boolean;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
}
/** GSTR-1 JSON structure matching GSTN schema (Phase 2) */
export interface GSTR1 {
    gstin: string;
    fp: string;
    b2b: GSTR1B2B[];
    b2c: GSTR1B2C[];
    hsnsum: GSTR1HSN[];
    docs: GSTR1DocSummary;
}
export interface GSTR1B2B {
    ctin: string;
    inv: GSTR1InvoiceDetail[];
}
export interface GSTR1B2C {
    txval: number;
    rt: number;
    iamt?: number;
    camt?: number;
    samt?: number;
}
export interface GSTR1InvoiceDetail {
    inum: string;
    idt: string;
    val: number;
    pos: string;
    itms: GSTR1Item[];
}
export interface GSTR1Item {
    num: number;
    itm_det: {
        txval: number;
        rt: number;
        iamt?: number;
        camt?: number;
        samt?: number;
    };
}
export interface GSTR1HSN {
    hsn_sc: string;
    desc: string;
    uqc: string;
    qty: number;
    val: number;
    txval: number;
    iamt: number;
    camt: number;
    samt: number;
}
export interface GSTR1DocSummary {
    doc_num: number;
    doc_sup: number;
}
/** GSTR-3B input (Phase 2) */
export interface GSTR3B {
    gstin: string;
    fp: string;
    outward: OutwardSupply;
    itc: ITC;
    interest: Interest;
}
export interface OutwardSupply {
    taxable: number;
    tax: number;
}
export interface ITC {
    eligible: number;
    claimed: number;
}
export interface Interest {
    lateFee: number;
    interest: number;
}
//# sourceMappingURL=types.d.ts.map