"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const parse_intent_js_1 = require("../parse-intent.js");
const mockMessagesCreate = vitest_1.vi.fn();
vitest_1.vi.mock('@anthropic-ai/sdk', () => ({
    default: vitest_1.vi.fn().mockImplementation(() => ({
        messages: {
            create: mockMessagesCreate,
        },
    })),
}));
const BASE_INPUT = {
    text: '',
    conversationState: {},
    businessContext: {
        businessId: 'biz-1',
        customers: ['Ramesh', 'Suresh', 'Sharma ji', 'Verma ji'],
        products: ['chawal', 'aata', 'doodh', 'tel'],
        language: 'hi',
    },
};
async function runWithMock(text, mockResponse) {
    mockMessagesCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: JSON.stringify(mockResponse) }],
    });
    return (0, parse_intent_js_1.parseIntent)({ ...BASE_INPUT, text });
}
async function runFallback(text) {
    mockMessagesCreate.mockRejectedValueOnce(new Error('API unavailable'));
    return (0, parse_intent_js_1.parseIntent)({ ...BASE_INPUT, text });
}
(0, vitest_1.describe)('parseIntent (Claude branch)', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        process.env.ANTHROPIC_API_KEY = 'test-key';
    });
    (0, vitest_1.it)('classifies create_invoice intent', async () => {
        const result = await runWithMock('Ramesh ko 10kg chawal ka invoice bhejo', {
            intent: 'create_invoice',
            confidence: 0.92,
            entities: {
                customer: 'Ramesh',
                items: [{ name: 'chawal', qty: 10, unit: 'kg', rate: null }],
                amount: null,
                payment_mode: null,
            },
            missingFields: ['items[0].rate'],
            suggestedReply: 'Chawal ka rate kya hai per kg?',
            requiresConfirmation: false,
        });
        (0, vitest_1.expect)(result.intent).toBe('create_invoice');
        (0, vitest_1.expect)(result.entities.customer).toBe('Ramesh');
        (0, vitest_1.expect)(result.entities.items).toHaveLength(1);
        (0, vitest_1.expect)(result.entities.items[0].name).toBe('chawal');
        (0, vitest_1.expect)(result.missingFields).toContain('items[0].rate');
        (0, vitest_1.expect)(result.suggestedReply).toBeTruthy();
    });
    (0, vitest_1.it)('classifies record_payment intent for UPI payment', async () => {
        const result = await runWithMock('sharma ji ne 2000 diye upi se', {
            intent: 'record_payment',
            confidence: 0.95,
            entities: {
                customer: 'sharma ji',
                amount: 2000,
                payment_mode: 'upi',
            },
            missingFields: [],
            suggestedReply: 'Sharma ji ka ₹2000 upi se receive ho gaya ✅',
            requiresConfirmation: false,
        });
        (0, vitest_1.expect)(result.intent).toBe('record_payment');
        (0, vitest_1.expect)(result.entities.customer).toBe('sharma ji');
        (0, vitest_1.expect)(result.entities.amount).toBe(2000);
        (0, vitest_1.expect)(result.entities.payment_mode).toBe('upi');
    });
    (0, vitest_1.it)('classifies add_stock intent', async () => {
        const result = await runWithMock('50 packet biscuit aaye aaj', {
            intent: 'add_stock',
            confidence: 0.88,
            entities: {
                items: [{ name: 'biscuit', qty: 50, unit: 'packet', rate: null }],
                movement: 'in',
            },
            missingFields: [],
            suggestedReply: '50 packet biscuit stock mein add ho gaye ✅',
            requiresConfirmation: false,
        });
        (0, vitest_1.expect)(result.intent).toBe('add_stock');
        (0, vitest_1.expect)(result.entities.movement).toBe('in');
        if (result.entities.items) {
            (0, vitest_1.expect)(result.entities.items[0].name).toBe('biscuit');
        }
    });
    (0, vitest_1.it)('classifies check_udhaar intent', async () => {
        const result = await runWithMock('suresh ka kitna baaki hai', {
            intent: 'check_udhaar',
            confidence: 0.94,
            entities: { customer: 'suresh' },
            missingFields: [],
            suggestedReply: 'Suresh par ₹0 ka baaki hai. Sab clear hai ✅',
            requiresConfirmation: false,
        });
        (0, vitest_1.expect)(result.intent).toBe('check_udhaar');
        (0, vitest_1.expect)(result.entities.customer).toBe('suresh');
    });
    (0, vitest_1.it)('classifies view_report intent', async () => {
        const result = await runWithMock('aaj kitna hua', {
            intent: 'view_report',
            confidence: 0.91,
            entities: { period: 'today' },
            missingFields: [],
            suggestedReply: 'Aaj ki report le raha hoon...',
            requiresConfirmation: false,
        });
        (0, vitest_1.expect)(result.intent).toBe('view_report');
        (0, vitest_1.expect)(result.entities.period).toBe('today');
    });
    (0, vitest_1.it)('classifies cancel_invoice intent', async () => {
        const result = await runWithMock('invoice number 47 cancel karo', {
            intent: 'cancel_invoice',
            confidence: 0.96,
            entities: { invoice_number: 47 },
            missingFields: [],
            suggestedReply: 'Kya aap invoice #47 cancel karna chahte hain?',
            requiresConfirmation: true,
        });
        (0, vitest_1.expect)(result.intent).toBe('cancel_invoice');
        (0, vitest_1.expect)(result.entities.invoice_number).toBe(47);
        (0, vitest_1.expect)(result.requiresConfirmation).toBe(true);
    });
    (0, vitest_1.it)('overrides to unknown when confidence < 0.6', async () => {
        const result = await runWithMock('some random gibberish', {
            intent: 'create_invoice',
            confidence: 0.4,
            entities: {},
            missingFields: [],
            suggestedReply: '',
            requiresConfirmation: false,
        });
        (0, vitest_1.expect)(result.intent).toBe('unknown');
        (0, vitest_1.expect)(result.confidence).toBeLessThan(0.6);
        (0, vitest_1.expect)(result.suggestedReply).toBeTruthy();
    });
    (0, vitest_1.it)('maps invalid intent strings to unknown', async () => {
        const result = await runWithMock('blah blah', {
            intent: 'send_money',
            confidence: 0.85,
            entities: {},
            missingFields: [],
            suggestedReply: 'Sorry?',
            requiresConfirmation: false,
        });
        (0, vitest_1.expect)(result.intent).toBe('unknown');
    });
});
(0, vitest_1.describe)('parseIntent (fallback)', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        process.env.ANTHROPIC_API_KEY = 'test-key';
    });
    (0, vitest_1.it)('fallback: invoice keywords', async () => {
        const result = await runFallback('Ramesh ka invoice banao');
        (0, vitest_1.expect)(result.intent).toBe('create_invoice');
        (0, vitest_1.expect)(result.suggestedReply.toLowerCase()).toContain('invoice');
    });
    (0, vitest_1.it)('fallback: payment keywords', async () => {
        const result = await runFallback('Ramesh ne rupaye diye');
        (0, vitest_1.expect)(result.intent).toBe('record_payment');
    });
    (0, vitest_1.it)('fallback: stock keywords', async () => {
        const result = await runFallback('50 kg chawal aaya');
        (0, vitest_1.expect)(result.intent).toBe('add_stock');
    });
    (0, vitest_1.it)('fallback: udhaar keywords', async () => {
        const result = await runFallback('suresh ka udhaar batao');
        (0, vitest_1.expect)(result.intent).toBe('check_udhaar');
    });
    (0, vitest_1.it)('fallback: report keywords', async () => {
        const result = await runFallback('aaj ki report do');
        (0, vitest_1.expect)(result.intent).toBe('view_report');
    });
    (0, vitest_1.it)('fallback: GST keywords', async () => {
        const result = await runFallback('mera gst number check karo');
        (0, vitest_1.expect)(result.intent).toBe('check_gst');
    });
    (0, vitest_1.it)('fallback: help keywords', async () => {
        const result = await runFallback('kaise use karte hain');
        (0, vitest_1.expect)(result.intent).toBe('help');
    });
    (0, vitest_1.it)('fallback: unknown input', async () => {
        const result = await runFallback('xyzwq mnbvc');
        (0, vitest_1.expect)(result.intent).toBe('unknown');
        (0, vitest_1.expect)(result.confidence).toBeLessThan(0.5);
    });
});
(0, vitest_1.describe)('parseIntent (additional coverage)', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        process.env.ANTHROPIC_API_KEY = 'test-key';
    });
    (0, vitest_1.it)('handles send_reminder intent', async () => {
        const result = await runWithMock('suresh ko payment reminder bhejo', {
            intent: 'send_reminder',
            confidence: 0.88,
            entities: { customer: 'suresh' },
            missingFields: [],
            suggestedReply: 'Suresh ko reminder bhej du?',
            requiresConfirmation: true,
        });
        (0, vitest_1.expect)(result.intent).toBe('send_reminder');
        (0, vitest_1.expect)(result.entities.customer).toBe('suresh');
    });
    (0, vitest_1.it)('handles update_customer intent', async () => {
        const result = await runWithMock('naya customer Ramesh ka number add karo', {
            intent: 'update_customer',
            confidence: 0.85,
            entities: { customer: 'Ramesh', customer_phone: '9876543210' },
            missingFields: [],
            suggestedReply: 'Ramesh ka number add kar du?',
            requiresConfirmation: true,
        });
        (0, vitest_1.expect)(result.intent).toBe('update_customer');
    });
    (0, vitest_1.it)('handles check_gst intent', async () => {
        const result = await runWithMock('₹5000 par GST kitna hoga', {
            intent: 'check_gst',
            confidence: 0.82,
            entities: { amount: 5000 },
            missingFields: [],
            suggestedReply: '₹5000 par 5% GST = ₹250 hoga.',
            requiresConfirmation: false,
        });
        (0, vitest_1.expect)(result.intent).toBe('check_gst');
    });
    (0, vitest_1.it)('handles onboarding intent', async () => {
        const result = await runWithMock('mera business setup karo', {
            intent: 'onboarding',
            confidence: 0.9,
            entities: {},
            missingFields: ['business_name'],
            suggestedReply: 'Aapke business ka naam kya hai?',
            requiresConfirmation: false,
        });
        (0, vitest_1.expect)(result.intent).toBe('onboarding');
    });
    (0, vitest_1.it)('handles help intent', async () => {
        const result = await runWithMock('aap kya kar sakte hain', {
            intent: 'help',
            confidence: 0.87,
            entities: {},
            missingFields: [],
            suggestedReply: 'Main Hisab-Kitaab hoon! Aap mujhse invoice bhej sakte hain...',
            requiresConfirmation: false,
        });
        (0, vitest_1.expect)(result.intent).toBe('help');
    });
});
(0, vitest_1.describe)('parseIntent (edge cases)', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        process.env.ANTHROPIC_API_KEY = 'test-key';
    });
    (0, vitest_1.it)('handles empty text via fallback', async () => {
        const result = await runFallback('');
        (0, vitest_1.expect)(result.intent).toBe('unknown');
        (0, vitest_1.expect)(result.suggestedReply).toBeTruthy();
    });
    (0, vitest_1.it)('handles non-JSON Claude response gracefully', async () => {
        mockMessagesCreate.mockResolvedValueOnce({
            content: [{ type: 'text', text: 'Sorry, I could not process that.' }],
        });
        const result = await (0, parse_intent_js_1.parseIntent)({ ...BASE_INPUT, text: 'hello' });
        (0, vitest_1.expect)(result.intent).toBe('help');
    });
    (0, vitest_1.it)('handles Claude response with embedded JSON', async () => {
        mockMessagesCreate.mockResolvedValueOnce({
            content: [{
                    type: 'text',
                    text: 'Here is the parsed intent: {"intent": "view_report", "confidence": 0.9, "entities": {"period": "today"}, "missingFields": [], "suggestedReply": "Report ready", "requiresConfirmation": false}',
                }],
        });
        const result = await (0, parse_intent_js_1.parseIntent)({ ...BASE_INPUT, text: 'aaj ka hisab' });
        (0, vitest_1.expect)(result.intent).toBe('view_report');
        (0, vitest_1.expect)(result.entities.period).toBe('today');
    });
    (0, vitest_1.it)('fallback: subscription keywords', async () => {
        const result = await runFallback('mujhe premium plan lena hai');
        (0, vitest_1.expect)(result.intent).toBe('subscription');
    });
    (0, vitest_1.it)('fallback: reconciliation keywords via bank SMS', async () => {
        const result = await runFallback('Rs 1,500 credited to your account from UPI');
        (0, vitest_1.expect)(result.intent).toBe('reconciliation');
    });
    (0, vitest_1.it)('Claude: subscription intent', async () => {
        const result = await runWithMock('vyapari plan kya hai', {
            intent: 'subscription',
            confidence: 0.91,
            entities: { plan: 'vyapari' },
            missingFields: [],
            suggestedReply: 'Vyapari plan ₹499/month hai. Isme unlimited invoices aur stock management hai.',
            requiresConfirmation: false,
        });
        (0, vitest_1.expect)(result.intent).toBe('subscription');
        (0, vitest_1.expect)(result.entities.plan).toBe('vyapari');
    });
    (0, vitest_1.it)('Claude: reconciliation intent', async () => {
        const result = await runWithMock('UPI money credited 2000 from Ramesh', {
            intent: 'reconciliation',
            confidence: 0.87,
            entities: {},
            missingFields: [],
            suggestedReply: 'Bank SMS receive hua. Payment reconcile kar raha hoon...',
            requiresConfirmation: false,
        });
        (0, vitest_1.expect)(result.intent).toBe('reconciliation');
    });
});
//# sourceMappingURL=parse-intent.test.js.map