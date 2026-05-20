import Anthropic from '@anthropic-ai/sdk';
const CLAUDE_SYSTEM_PROMPT = `You are Hisab-Kitaab's business assistant for Indian MSMEs.
Extract structured business intent from Hindi/English/Hinglish messages.

RULES:
- Always respond with valid JSON only. No prose, no markdown.
- Extract numbers written as: ₹850, 850 rupaye, aath sau pachaas
- Understand: "udhaar" = credit, "udhar" = same
- Understand: "bhejo" = send, "banao" = create, "aaya" = received
- Understand: "aaj" = today, "kal" = yesterday, "pichhla mahina" = last month
- Understand: "baaki" = pending balance, "kitna baaki" = how much pending
- Understand: "kaun sa" = which, "kahan" = where, "kya" = what
- Customer names in Indian context: Ramesh, Suresh, Sharma ji, Verma ji, etc.
- Units: kg, litre/liter/L, piece/pcs/nag, dozen, box, packet
- Payment modes: upi, cash, card, netbanking, cheque, gpay, phonepay, paytm
- If confidence < 0.6, set intent to "unknown" and ask for clarification
- suggestedReply MUST be in the same language as the input message
- For Hindi messages, reply in Hindi using simple words (not formal)
- requiresConfirmation is true when the action is destructive or irreversible

INTENT CLASSIFICATION RULES (follow strictly):

create_invoice: ANY message containing words like:
  invoice, bill, receipt, bhejo, banao, generate
  OR customer name + items + rate in any format
  Examples:
  - "Ramesh ko invoice bhejo"
  - "Vimal ko 500 ka bill banao"
  - "Customer: Ramesh, Item: rice, rate 50"
  - "invoice bhejna hai"
  - "bill chahiye"

record_payment: ONLY when explicitly about receiving money:
  - "Ramesh ne 500 diye"
  - "payment mili 1000"
  - "paisa aa gaya"
  NOT when someone says "rate 500" or "500 rupay" in invoice context

add_stock: ONLY about inventory/stock coming in:
  - "50kg chawal aaya"
  - "stock add karo"

view_report: ONLY about seeing reports/summaries:
  - "aaj ki report"
  - "kitna hua aaj"
  - "monthly summary"
  NOT when someone says "testing report" as a product/service name

check_udhaar: ONLY about checking who owes money

help: when user asks what the bot can do

send_reminder: Send payment reminder to a customer
update_customer: Add or update customer details
check_gst: GST-related calculation or validation
cancel_invoice: Cancel or delete an invoice
subscription: Subscribe, upgrade, or check plans. Keywords: "subscribe", "plan", "upgrade", "price", "renew"
reconciliation: Forwarded bank SMS for UPI payment reconciliation. The message contains bank SMS text.
onboarding: Business setup, first-time configuration
unknown: ONLY when truly unclear after checking all above

CRITICAL RULES:
- "borewell testing report" is a SERVICE NAME not a report request
- "rate 500" means invoice rate, not payment received
- When in doubt between create_invoice and unknown, choose create_invoice
- Never route to record_payment unless money is explicitly received

OUTPUT FORMAT:
{
  "intent": "create_invoice",
  "confidence": 0.92,
  "entities": {
    "customer": "Ramesh",
    "items": [{"name": "chawal", "qty": 10, "unit": "kg", "rate": null}],
    "amount": null,
    "payment_mode": null,
    "invoice_number": null,
    "movement": null,
    "period": null,
    "report_type": null
  },
  "missingFields": ["items[0].rate"],
  "suggestedReply": "Chawal ka rate kya hai per kg?",
  "requiresConfirmation": false
}`;
export async function parseIntent(input) {
    const { text, conversationState, businessContext } = input;
    const userMessage = buildContextMessage(text, businessContext, conversationState);
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    });
    try {
        const response = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system: CLAUDE_SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: userMessage,
                },
            ],
        });
        const content = response.content[0];
        const responseText = content.type === 'text' ? content.text : '';
        return parseClaudeResponse(responseText, text);
    }
    catch (error) {
        console.error('Claude API error in parseIntent:', error);
        return localFallback(text);
    }
}
function buildContextMessage(text, ctx, state) {
    let msg = `User message: "${text}"\n\n`;
    if (ctx.customers.length > 0) {
        msg += `Known customers: ${ctx.customers.join(', ')}\n`;
    }
    if (ctx.products.length > 0) {
        msg += `Known products: ${ctx.products.join(', ')}\n`;
    }
    msg += `User preferred language: ${ctx.language}\n`;
    if (Object.keys(state).length > 0) {
        msg += `Conversation state: ${JSON.stringify(state)}\n`;
    }
    return msg;
}
function parseClaudeResponse(responseText, originalText) {
    let parsed;
    try {
        parsed = JSON.parse(responseText);
    }
    catch {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                parsed = JSON.parse(jsonMatch[0]);
            }
            catch {
                return localFallback(originalText);
            }
        }
        else {
            return localFallback(originalText);
        }
    }
    const intent = validateIntent(String(parsed.intent || 'unknown'));
    const confidence = Number(parsed.confidence) || 0.1;
    const rawEntities = parsed.entities || {};
    const entities = {
        customer: rawEntities.customer ? String(rawEntities.customer) : undefined,
        items: Array.isArray(rawEntities.items) ? rawEntities.items : undefined,
        amount: rawEntities.amount != null ? Number(rawEntities.amount) : null,
        payment_mode: rawEntities.payment_mode ? String(rawEntities.payment_mode) : null,
        invoice_number: rawEntities.invoice_number != null ? Number(rawEntities.invoice_number) : null,
        movement: rawEntities.movement === 'out' ? 'out' : rawEntities.movement === 'in' ? 'in' : undefined,
        period: rawEntities.period ? String(rawEntities.period) : undefined,
        report_type: rawEntities.report_type ? String(rawEntities.report_type) : undefined,
    };
    if (rawEntities.item_name)
        entities.item_name = String(rawEntities.item_name);
    if (rawEntities.quantity != null)
        entities.quantity = Number(rawEntities.quantity);
    if (rawEntities.unit)
        entities.unit = String(rawEntities.unit);
    for (const [key, val] of Object.entries(rawEntities)) {
        if (!(key in entities)) {
            entities[key] = val;
        }
    }
    const missingFields = Array.isArray(parsed.missingFields)
        ? parsed.missingFields.map(String)
        : [];
    let suggestedReply = parsed.suggestedReply ? String(parsed.suggestedReply) : '';
    const requiresConfirmation = Boolean(parsed.requiresConfirmation);
    const finalIntent = confidence < 0.6 ? 'unknown' : intent;
    if (finalIntent === 'unknown' && !suggestedReply) {
        suggestedReply = guessLanguage(originalText) === 'hi'
            ? 'Mujhe samajh nahi aaya. Kya aap invoice bhejna chahte hain, payment record karna chahte hain, ya stock update karna chahte hain?'
            : "I didn't understand. Would you like to send an invoice, record a payment, or update stock?";
    }
    return {
        intent: finalIntent,
        confidence: finalIntent === 'unknown' ? Math.min(confidence, 0.59) : confidence,
        entities,
        missingFields,
        suggestedReply,
        requiresConfirmation,
    };
}
function validateIntent(intent) {
    const validIntents = [
        'create_invoice', 'record_payment', 'add_stock', 'check_udhaar',
        'view_report', 'send_reminder', 'update_customer', 'check_gst',
        'cancel_invoice', 'subscription', 'reconciliation',
        'onboarding', 'help', 'unknown',
    ];
    if (validIntents.includes(intent)) {
        return intent;
    }
    return 'unknown';
}
function localFallback(text) {
    const lower = text.toLowerCase();
    if (/invoice|bhej|banao|bill|chalan|rate|rupay|rupaye|customer.*item|naam.*item/.test(lower)) {
        return {
            intent: 'create_invoice',
            confidence: 0.5,
            entities: {},
            missingFields: ['customer', 'items'],
            suggestedReply: 'Invoice ke liye customer ka naam bataayein aur items ki list bhejein.',
            requiresConfirmation: false,
        };
    }
    if (/credited|debited|bank.*msg|sms.*bank|account.*credit/.test(lower)) {
        return {
            intent: 'reconciliation',
            confidence: 0.5,
            entities: {},
            missingFields: [],
            suggestedReply: 'Bank SMS mil gaya. Payment reconciliation kar raha hoon...',
            requiresConfirmation: false,
        };
    }
    if (/subscribe|plan\b|subscription|upgrade|renew|pricing|premium/.test(lower)) {
        return {
            intent: 'subscription',
            confidence: 0.5,
            entities: {},
            missingFields: [],
            suggestedReply: 'Aapke liye teen plans hain: Chhota, Vyapari, aur Dhanda. Kaunsa plan dekhna chahenge?',
            requiresConfirmation: false,
        };
    }
    if (/diye|diya|paytm|gpay\b|bhare|payment received|paisa (mil|aa|aaya)|ne.*diye|ne.*diya/.test(lower)) {
        return {
            intent: 'record_payment',
            confidence: 0.5,
            entities: {},
            missingFields: ['customer', 'amount'],
            suggestedReply: 'Kis customer ne payment di? Aur kitni rakam?',
            requiresConfirmation: false,
        };
    }
    if (/stock|aaya|aaye|maal|samaan|inventory|stock karo|gaddi/.test(lower)) {
        return {
            intent: 'add_stock',
            confidence: 0.5,
            entities: {},
            missingFields: ['item_name', 'quantity'],
            suggestedReply: 'Kaun sa item aaya? Kitna quantity?',
            requiresConfirmation: false,
        };
    }
    if (/udhaar|baaki|bakaya|kita baaki|dena hai|lena hai/.test(lower)) {
        return {
            intent: 'check_udhaar',
            confidence: 0.55,
            entities: {},
            missingFields: [],
            suggestedReply: 'Kis customer ka baaki dekhna hai?',
            requiresConfirmation: false,
        };
    }
    if (/report|aaj (ka|ki)|summary|kitna hua|kya hua|hisab|sales|income/.test(lower)) {
        return {
            intent: 'view_report',
            confidence: 0.5,
            entities: { period: 'today' },
            missingFields: [],
            suggestedReply: 'Aaj ki report le raha hoon...',
            requiresConfirmation: false,
        };
    }
    if (/gst|tax|gstin|gst number/.test(lower)) {
        return {
            intent: 'check_gst',
            confidence: 0.5,
            entities: {},
            missingFields: [],
            suggestedReply: 'GST-related jaankari ke liye kripya apna GSTIN number bataayein.',
            requiresConfirmation: false,
        };
    }
    if (/help|kaise|samajh|madad|kya kar|sikhao|guide|hello|hii|hey|namaste/.test(lower)) {
        return {
            intent: 'help',
            confidence: 0.6,
            entities: {},
            missingFields: [],
            suggestedReply: 'Main Hisab-Kitaab hoon! Aap mujhse invoice bhej sakte hain, payment record kar sakte hain, stock update kar sakte hain, aur report dekh sakte hain. Kya karna chahenge?',
            requiresConfirmation: false,
        };
    }
    return {
        intent: 'unknown',
        confidence: 0.2,
        entities: {},
        missingFields: [],
        suggestedReply: 'Mujhe samajh nahi aaya. Kya aap invoice bhejna chahte hain, payment record karna chahte hain, ya stock update karna chahte hain?',
        requiresConfirmation: false,
    };
}
function guessLanguage(text) {
    const hindiPattern = /[ऀ-ॿ]/;
    if (hindiPattern.test(text))
        return 'hi';
    const hindiWords = [
        'hai', 'hain', 'ka', 'ki', 'ke', 'ko', 'se', 'mein', 'me', 'par',
        'kya', 'kyu', 'kaise', 'kahan', 'kab', 'kitna', 'kitne',
        'bhejo', 'banao', 'aaya', 'aaye', 'diya', 'diye', 'karo', 'lo',
        'mera', 'tera', 'apna', 'yeh', 'woh', 'vo',
        'chawal', 'aata', 'doodh', 'tel', 'namak', 'chini',
        'udhaar', 'baaki', 'rupaye', 'paisa', 'paise',
        'aaj', 'kal', 'mahina', 'saal', 'haftha',
        'raha', 'rahe', 'tha', 'the', 'thi', 'thin',
        'sakta', 'sakte', 'sakti',
    ];
    const words = text.toLowerCase().split(/\s+/);
    const hindiMatchCount = words.filter(w => hindiWords.includes(w)).length;
    return hindiMatchCount >= 2 ? 'hi' : 'en';
}
//# sourceMappingURL=parse-intent.js.map