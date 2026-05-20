"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processNlp = processNlp;
const nlp_1 = require("@hisab-kitaab/nlp");
// Map NLP package intent names → backend intent names
const INTENT_MAP = {
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
/**
 * Process natural language input through the NLP pipeline.
 * Delegates to the @hisab-kitaab/nlp package.
 */
async function processNlp(params) {
    const { text, state, business_context } = params;
    const result = await (0, nlp_1.parseIntent)({
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
        entities: result.entities,
        confidence: result.confidence,
        response: result.suggestedReply,
    };
}
