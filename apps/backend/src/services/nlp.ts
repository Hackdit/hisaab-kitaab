import { parseIntent } from '@hisab-kitaab/nlp';

// Map NLP package intent names → backend intent names
const INTENT_MAP: Record<string, string> = {
  create_invoice: 'invoice',
  record_payment: 'payment',
  add_stock: 'stock',
  check_udhaar: 'payment',
  view_report: 'report',
  send_reminder: 'payment',
  update_customer: 'invoice', // treated as customer update during invoice flow
  check_gst: 'report',
  cancel_invoice: 'invoice',
  subscription: 'subscription',
  reconciliation: 'reconciliation',
  onboarding: 'onboarding',
  help: 'unknown',
  unknown: 'unknown',
};

// Re-export the output type for backwards compat
export interface NlpResult {
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  response: string;
}

/**
 * Process natural language input through the NLP pipeline.
 * Delegates to the @hisab-kitaab/nlp package.
 */
export async function processNlp(params: {
  text: string;
  state: any;
  business_context: {
    id: string;
    name: string;
    gstin: string | null;
  };
}): Promise<NlpResult> {
  const { text, state, business_context } = params;

  const result = await parseIntent({
    text,
    conversationState: state ?? {},
    businessContext: {
      businessId: business_context.id,
      customers: [],
      products: [],
      language: 'hi',
    },
  });

  // Map to backend's expected format
  return {
    intent: INTENT_MAP[result.intent] || 'unknown',
    entities: result.entities as Record<string, any>,
    confidence: result.confidence,
    response: result.suggestedReply,
  };
}