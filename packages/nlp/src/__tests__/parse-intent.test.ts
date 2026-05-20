import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseIntent } from '../parse-intent.js';
import type { ParseInput } from '../types.js';

// Shared mock for Anthropic messages.create — same fn for every instance
const mockMessagesCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: mockMessagesCreate,
    },
  })),
}));

const BASE_INPUT: ParseInput = {
  text: '',
  conversationState: {},
  businessContext: {
    businessId: 'biz-1',
    customers: ['Ramesh', 'Suresh', 'Sharma ji', 'Verma ji'],
    products: ['chawal', 'aata', 'doodh', 'tel'],
    language: 'hi',
  },
};

async function runWithMock(text: string, mockResponse: Record<string, unknown>) {
  mockMessagesCreate.mockResolvedValueOnce({
    content: [{ type: 'text', text: JSON.stringify(mockResponse) }],
  });

  return parseIntent({ ...BASE_INPUT, text });
}

// Fallback tests (Claude API fails)
async function runFallback(text: string) {
  mockMessagesCreate.mockRejectedValueOnce(new Error('API unavailable'));
  return parseIntent({ ...BASE_INPUT, text });
}

// ──────────────────────────────────────────
// Claude-powered tests
// ──────────────────────────────────────────

describe('parseIntent (Claude branch)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  // 1. create_invoice
  it('classifies create_invoice intent', async () => {
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

    expect(result.intent).toBe('create_invoice');
    expect(result.entities.customer).toBe('Ramesh');
    expect(result.entities.items).toHaveLength(1);
    expect(result.entities.items![0].name).toBe('chawal');
    expect(result.missingFields).toContain('items[0].rate');
    expect(result.suggestedReply).toBeTruthy();
  });

  // 2. record_payment
  it('classifies record_payment intent for UPI payment', async () => {
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

    expect(result.intent).toBe('record_payment');
    expect(result.entities.customer).toBe('sharma ji');
    expect(result.entities.amount).toBe(2000);
    expect(result.entities.payment_mode).toBe('upi');
  });

  // 3. add_stock
  it('classifies add_stock intent', async () => {
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

    expect(result.intent).toBe('add_stock');
    expect(result.entities.movement).toBe('in');
    if (result.entities.items) {
      expect(result.entities.items[0].name).toBe('biscuit');
    }
  });

  // 4. check_udhaar
  it('classifies check_udhaar intent', async () => {
    const result = await runWithMock('suresh ka kitna baaki hai', {
      intent: 'check_udhaar',
      confidence: 0.94,
      entities: { customer: 'suresh' },
      missingFields: [],
      suggestedReply: 'Suresh par ₹0 ka baaki hai. Sab clear hai ✅',
      requiresConfirmation: false,
    });

    expect(result.intent).toBe('check_udhaar');
    expect(result.entities.customer).toBe('suresh');
  });

  // 5. view_report
  it('classifies view_report intent', async () => {
    const result = await runWithMock('aaj kitna hua', {
      intent: 'view_report',
      confidence: 0.91,
      entities: { period: 'today' },
      missingFields: [],
      suggestedReply: 'Aaj ki report le raha hoon...',
      requiresConfirmation: false,
    });

    expect(result.intent).toBe('view_report');
    expect(result.entities.period).toBe('today');
  });

  // 6. cancel_invoice
  it('classifies cancel_invoice intent', async () => {
    const result = await runWithMock('invoice number 47 cancel karo', {
      intent: 'cancel_invoice',
      confidence: 0.96,
      entities: { invoice_number: 47 },
      missingFields: [],
      suggestedReply: 'Kya aap invoice #47 cancel karna chahte hain?',
      requiresConfirmation: true,
    });

    expect(result.intent).toBe('cancel_invoice');
    expect(result.entities.invoice_number).toBe(47);
    expect(result.requiresConfirmation).toBe(true);
  });

  // 7. Unknown intent with low confidence
  it('overrides to unknown when confidence < 0.6', async () => {
    const result = await runWithMock('some random gibberish', {
      intent: 'create_invoice',
      confidence: 0.4,
      entities: {},
      missingFields: [],
      suggestedReply: '',
      requiresConfirmation: false,
    });

    expect(result.intent).toBe('unknown');
    expect(result.confidence).toBeLessThan(0.6);
    expect(result.suggestedReply).toBeTruthy();
  });

  // 8. Invalid intent string
  it('maps invalid intent strings to unknown', async () => {
    const result = await runWithMock('blah blah', {
      intent: 'send_money',
      confidence: 0.85,
      entities: {},
      missingFields: [],
      suggestedReply: 'Sorry?',
      requiresConfirmation: false,
    });

    expect(result.intent).toBe('unknown');
  });
});

// ──────────────────────────────────────────
// Fallback (regex) tests
// ──────────────────────────────────────────

describe('parseIntent (fallback)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  it('fallback: invoice keywords', async () => {
    const result = await runFallback('Ramesh ka invoice banao');
    expect(result.intent).toBe('create_invoice');
    expect(result.suggestedReply.toLowerCase()).toContain('invoice');
  });

  it('fallback: payment keywords', async () => {
    const result = await runFallback('Ramesh ne rupaye diye');
    expect(result.intent).toBe('record_payment');
  });

  it('fallback: stock keywords', async () => {
    const result = await runFallback('50 kg chawal aaya');
    expect(result.intent).toBe('add_stock');
  });

  it('fallback: udhaar keywords', async () => {
    const result = await runFallback('suresh ka udhaar batao');
    expect(result.intent).toBe('check_udhaar');
  });

  it('fallback: report keywords', async () => {
    const result = await runFallback('aaj ki report do');
    expect(result.intent).toBe('view_report');
  });

  it('fallback: GST keywords', async () => {
    const result = await runFallback('mera gst number check karo');
    expect(result.intent).toBe('check_gst');
  });

  it('fallback: help keywords', async () => {
    const result = await runFallback('kaise use karte hain');
    expect(result.intent).toBe('help');
  });

  it('fallback: unknown input', async () => {
    const result = await runFallback('xyzwq mnbvc');
    expect(result.intent).toBe('unknown');
    expect(result.confidence).toBeLessThan(0.5);
  });
});

// ──────────────────────────────────────────
// Additional intent coverage
// ──────────────────────────────────────────

describe('parseIntent (additional coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  it('handles send_reminder intent', async () => {
    const result = await runWithMock('suresh ko payment reminder bhejo', {
      intent: 'send_reminder',
      confidence: 0.88,
      entities: { customer: 'suresh' },
      missingFields: [],
      suggestedReply: 'Suresh ko reminder bhej du?',
      requiresConfirmation: true,
    });

    expect(result.intent).toBe('send_reminder');
    expect(result.entities.customer).toBe('suresh');
  });

  it('handles update_customer intent', async () => {
    const result = await runWithMock('naya customer Ramesh ka number add karo', {
      intent: 'update_customer',
      confidence: 0.85,
      entities: { customer: 'Ramesh', customer_phone: '9876543210' },
      missingFields: [],
      suggestedReply: 'Ramesh ka number add kar du?',
      requiresConfirmation: true,
    });

    expect(result.intent).toBe('update_customer');
  });

  it('handles check_gst intent', async () => {
    const result = await runWithMock('₹5000 par GST kitna hoga', {
      intent: 'check_gst',
      confidence: 0.82,
      entities: { amount: 5000 },
      missingFields: [],
      suggestedReply: '₹5000 par 5% GST = ₹250 hoga.',
      requiresConfirmation: false,
    });

    expect(result.intent).toBe('check_gst');
  });

  it('handles onboarding intent', async () => {
    const result = await runWithMock('mera business setup karo', {
      intent: 'onboarding',
      confidence: 0.9,
      entities: {},
      missingFields: ['business_name'],
      suggestedReply: 'Aapke business ka naam kya hai?',
      requiresConfirmation: false,
    });

    expect(result.intent).toBe('onboarding');
  });

  it('handles help intent', async () => {
    const result = await runWithMock('aap kya kar sakte hain', {
      intent: 'help',
      confidence: 0.87,
      entities: {},
      missingFields: [],
      suggestedReply: 'Main Hisab-Kitaab hoon! Aap mujhse invoice bhej sakte hain...',
      requiresConfirmation: false,
    });

    expect(result.intent).toBe('help');
  });
});

// ──────────────────────────────────────────
// Edge cases
// ──────────────────────────────────────────

describe('parseIntent (edge cases)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  it('handles empty text via fallback', async () => {
    const result = await runFallback('');
    expect(result.intent).toBe('unknown');
    expect(result.suggestedReply).toBeTruthy();
  });

  it('handles non-JSON Claude response gracefully', async () => {
    mockMessagesCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Sorry, I could not process that.' }],
    });

    const result = await parseIntent({ ...BASE_INPUT, text: 'hello' });
    expect(result.intent).toBe('help');
  });

  it('handles Claude response with embedded JSON', async () => {
    mockMessagesCreate.mockResolvedValueOnce({
      content: [{
        type: 'text',
        text: 'Here is the parsed intent: {"intent": "view_report", "confidence": 0.9, "entities": {"period": "today"}, "missingFields": [], "suggestedReply": "Report ready", "requiresConfirmation": false}',
      }],
    });

    const result = await parseIntent({ ...BASE_INPUT, text: 'aaj ka hisab' });
    expect(result.intent).toBe('view_report');
    expect(result.entities.period).toBe('today');
  });

  it('fallback: subscription keywords', async () => {
    const result = await runFallback('mujhe premium plan lena hai');
    expect(result.intent).toBe('subscription');
  });

  it('fallback: reconciliation keywords via bank SMS', async () => {
    const result = await runFallback('Rs 1,500 credited to your account from UPI');
    expect(result.intent).toBe('reconciliation');
  });

  it('Claude: subscription intent', async () => {
    const result = await runWithMock('vyapari plan kya hai', {
      intent: 'subscription',
      confidence: 0.91,
      entities: { plan: 'vyapari' },
      missingFields: [],
      suggestedReply: 'Vyapari plan ₹499/month hai. Isme unlimited invoices aur stock management hai.',
      requiresConfirmation: false,
    });

    expect(result.intent).toBe('subscription');
    expect(result.entities.plan).toBe('vyapari');
  });

  it('Claude: reconciliation intent', async () => {
    const result = await runWithMock('UPI money credited 2000 from Ramesh', {
      intent: 'reconciliation',
      confidence: 0.87,
      entities: {},
      missingFields: [],
      suggestedReply: 'Bank SMS receive hua. Payment reconcile kar raha hoon...',
      requiresConfirmation: false,
    });

    expect(result.intent).toBe('reconciliation');
  });
});