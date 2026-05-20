// ──────────────────────────────────────────
// Hisab-Kitaab NLP — Type Definitions
// ──────────────────────────────────────────

export type IntentType =
  | 'create_invoice'
  | 'record_payment'
  | 'add_stock'
  | 'check_udhaar'
  | 'view_report'
  | 'send_reminder'
  | 'update_customer'
  | 'check_gst'
  | 'cancel_invoice'
  | 'subscription'
  | 'reconciliation'
  | 'onboarding'
  | 'help'
  | 'unknown';

export interface LineItem {
  name: string;
  qty: number;
  unit: string;
  rate: number | null;
}

export interface Entities {
  customer?: string;
  customer_phone?: string;
  items?: LineItem[];
  amount?: number | null;
  payment_mode?: string | null;
  invoice_number?: number | null;
  item_name?: string;
  quantity?: number;
  unit?: string;
  movement?: 'in' | 'out';
  period?: string;
  report_type?: string;
  gstin?: string;
  business_name?: string;
  [key: string]: unknown;
}

export interface ParseInput {
  text: string;
  conversationState: Record<string, unknown>;
  businessContext: {
    businessId: string;
    customers: string[];
    products: string[];
    language: string;
  };
}

export interface ParseOutput {
  intent: IntentType;
  confidence: number;
  entities: Entities;
  missingFields: string[];
  suggestedReply: string;
  requiresConfirmation: boolean;
}

export interface TranscribeResult {
  text: string;
  durationMs: number;
  language: string;
}