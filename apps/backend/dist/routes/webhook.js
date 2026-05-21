"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRoutes = webhookRoutes;
const zod_1 = require("zod");
const openai_1 = __importDefault(require("openai"));
const supabase_1 = require("../plugins/supabase");
const redis_1 = require("../plugins/redis");
const whatsapp_1 = require("../services/whatsapp");
const nlp_1 = require("../services/nlp");
const conversation_1 = require("../services/conversation");
const invoice_flow_1 = require("../services/invoice-flow");
const payment_flow_1 = require("../services/payment-flow");
const stock_flow_1 = require("../services/stock-flow");
const report_flow_1 = require("../services/report-flow");
const subscription_manager_1 = require("../services/subscription-manager");
const razorpay_1 = require("../services/razorpay");
const upi_reconciliation_1 = require("../services/upi-reconciliation");
const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
// AiSensy Project API webhook payload shape
// Docs: aisensy.stoplight.io/docs/project-api
// Payload is nested under data.message — not flat at top level
const aisensyMessageSchema = zod_1.z.object({
    data: zod_1.z.object({
        message: zod_1.z.object({
            phone_number: zod_1.z.string(),
            message_content: zod_1.z.object({
                text: zod_1.z.string().optional().default('')
            }),
            message_type: zod_1.z.string().optional().default('TEXT')
        })
    })
}).passthrough();
function normalizeToRedisKey(raw) {
    // Strip any prefix and ensure +91 format for Redis state keys
    const cleaned = raw.replace(/^whatsapp:/, '').replace(/^\+/, '');
    // AiSensy sends without +, add +91 prefix if needed
    if (cleaned.startsWith('91') && cleaned.length === 12) {
        return `+${cleaned}`;
    }
    if (!cleaned.startsWith('+')) {
        return `+${cleaned}`;
    }
    return cleaned;
}
async function webhookRoutes(fastify) {
    // WhatsApp incoming message handler (AiSensy Project API webhook)
    fastify.post('/whatsapp', async (request, reply) => {
        try {
            // ═══ CRITICAL DEBUG: log raw payload BEFORE any processing ═══
            console.log('RAW AISENSY PAYLOAD:', JSON.stringify(request.body, null, 2));
            const parsed = aisensyMessageSchema.safeParse(request.body);
            if (!parsed.success) {
                fastify.log.error({ err: parsed.error, body: request.body }, 'Invalid AiSensy webhook payload');
                // Fallback: try to extract message from nested AiSensy structure or flat shapes
                const b = request.body;
                const from = b?.data?.message?.phone_number || b?.from || b?.waId || b?.phone || '';
                const text = b?.data?.message?.message_content?.text || b?.text || b?.body || b?.message || '';
                if (from) {
                    console.log('FALLBACK: extracted from=', from, 'text=', text);
                    const fromNumber = normalizeToRedisKey(from);
                    await (0, whatsapp_1.sendTextMessage)(fromNumber, 'Thanks for your message! Processing...');
                }
                return reply.status(200).send({ status: 'ok' });
            }
            const { data } = parsed.data;
            const from = data.message.phone_number;
            const messageText = data.message.message_content.text;
            const messageType = data.message.message_type.toLowerCase();
            const messageUrl = data.message?.message_content?.media?.url;
            const messageFilename = data.message?.message_content?.media?.filename;
            const messageMimeType = data.message?.message_content?.media?.mime_type;
            const fromNumber = normalizeToRedisKey(from);
            console.log('WEBHOOK: Message received', { from, fromRedis: fromNumber, body: messageText, type: messageType });
            // Transcribe audio via Whisper (if media URL provided by AiSensy)
            let processedText = messageText;
            if (messageType === 'audio' && messageUrl) {
                try {
                    const response = await fetch(messageUrl);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch media: ${response.statusText}`);
                    }
                    const audioBuffer = await response.arrayBuffer();
                    const extension = (messageFilename?.split('.').pop()) || (messageMimeType?.split('/')[1]) || 'ogg';
                    const file = new File([audioBuffer], `audio.${extension}`, { type: messageMimeType || 'audio/ogg' });
                    const transcription = await openai.audio.transcriptions.create({
                        file,
                        model: 'whisper-1',
                    });
                    processedText = transcription.text;
                    fastify.log.info(`Transcribed audio: ${processedText}`);
                }
                catch (error) {
                    fastify.log.error({ err: error }, 'Error transcribing audio');
                    await (0, whatsapp_1.sendTextMessage)(fromNumber, 'Sorry, I could not process the audio message. Please try again or send a text message.');
                    return reply.status(200).send({ status: 'ok' });
                }
            }
            // Load Redis state
            const stateKey = `whatsapp:state:${fromNumber}`;
            let state = null;
            try {
                const raw = await redis_1.redis.get(stateKey);
                if (raw) {
                    // @upstash/redis already parses JSON automatically
                    // so raw is already an object, not a string
                    state = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    console.log('REDIS LOADED STATE:', state);
                }
            }
            catch (err) {
                console.error('REDIS READ ERROR:', err);
            }
            // Look up business by the sender's number
            let business = null;
            try {
                const { data } = await supabase_1.supabase
                    .from('businesses')
                    .select('*')
                    .eq('whatsapp_number', fromNumber)
                    .single();
                business = data;
            }
            catch {
                // no matching business — will trigger onboarding
            }
            console.log('WEBHOOK: Business found', business ? business.id : 'NOT FOUND');
            // No business → onboarding
            if (!business) {
                console.log('WEBHOOK: Starting onboarding');
                const result = await (0, conversation_1.handleOnboarding)(fromNumber, processedText, state);
                console.log('WEBHOOK: Onboarding result', result);
                if (result?.state) {
                    await redis_1.redis.set(stateKey, JSON.stringify(result.state), { ex: 86400 });
                }
                return reply.status(200).send({ status: 'ok' });
            }
            // Business exists but no Redis state — initialize
            if (business && !state) {
                state = {
                    step: 'complete',
                    businessName: business.business_name,
                    gstin: business.gstin,
                };
                await redis_1.redis.set(stateKey, state, { ex: 86400 });
                console.log('INITIALIZED MISSING REDIS STATE for existing business');
            }
            // ── Debug: invoice flow state ──
            console.log('FULL REDIS STATE:', JSON.stringify(state));
            console.log('INVOICE FLOW ACTIVE:', state?.invoiceFlow?.active);
            // ── Active invoice flow — bypass NLP ──
            if (state?.invoiceFlow?.active) {
                console.log('ACTIVE INVOICE FLOW, step:', state.invoiceFlow.step);
                const result = await (0, invoice_flow_1.handleInvoiceFlow)(fromNumber, processedText, {}, state, business);
                if (result?.state) {
                    await redis_1.redis.set(stateKey, JSON.stringify(result.state), { ex: 86400 });
                }
                return reply.status(200).send({ status: 'ok' });
            }
            // NLP
            const nlpResult = await (0, nlp_1.processNlp)({
                text: processedText,
                state,
                business_context: { id: business.id, name: business.name, gstin: business.gstin },
            });
            console.log('NLP RESULT:', JSON.stringify({
                intent: nlpResult.intent,
                entities: nlpResult.entities,
                confidence: nlpResult.confidence,
            }));
            const { intent, entities } = nlpResult;
            console.log('ROUTING TO INTENT:', intent);
            // Route by intent
            let handlerResult;
            switch (intent) {
                case 'onboarding':
                    handlerResult = await (0, conversation_1.handleOnboarding)(fromNumber, processedText, state);
                    break;
                case 'create_invoice':
                case 'invoice':
                    handlerResult = await (0, invoice_flow_1.handleInvoiceFlow)(fromNumber, processedText, entities, state, business);
                    break;
                case 'record_payment':
                    if ((0, upi_reconciliation_1.looksLikeBankSms)(processedText)) {
                        await (0, upi_reconciliation_1.reconcilePayment)(fromNumber, business.id, processedText);
                        return reply.status(200).send({ status: 'ok' });
                    }
                    handlerResult = await (0, payment_flow_1.handlePaymentFlow)(fromNumber, processedText, entities, state, business);
                    break;
                case 'add_stock':
                    handlerResult = await (0, stock_flow_1.handleStockFlow)(fromNumber, processedText, entities, state, business);
                    break;
                case 'view_report':
                    handlerResult = await (0, report_flow_1.handleReportFlow)(fromNumber, state, business);
                    break;
                case 'subscription':
                    await (0, subscription_manager_1.handleSubscribeIntent)(fromNumber, business.id, business.name || business.business_name, entities.plan);
                    return reply.status(200).send({ status: 'ok' });
                case 'reconciliation':
                    await (0, upi_reconciliation_1.reconcilePayment)(fromNumber, business.id, processedText);
                    return reply.status(200).send({ status: 'ok' });
                case 'check_udhaar':
                case 'send_reminder':
                case 'update_customer':
                case 'check_gst':
                case 'cancel_invoice':
                case 'help':
                    await (0, whatsapp_1.sendTextMessage)(fromNumber, nlpResult.response);
                    break;
                case 'unknown':
                    await (0, whatsapp_1.sendTextMessage)(fromNumber, `मुझे समझ नहीं आया। कृपया कोशिश करें:\n\n` +
                        `📄 "Bill banao" - नया invoice\n` +
                        `💰 "Payment mila" - payment track करें\n` +
                        `📦 "Stock aaya" - inventory update\n` +
                        `❓ "Help" - मदद के लिए`);
                    break;
                default:
                    await (0, whatsapp_1.sendTextMessage)(fromNumber, nlpResult.response ||
                        "I'm not sure how to help with that. Please try rephrasing.");
            }
            // Update Redis state if handler returned one
            if (handlerResult?.state) {
                await redis_1.redis.set(stateKey, JSON.stringify(handlerResult.state), { ex: 86400 });
            }
            return reply.status(200).send({ status: 'ok' });
        }
        catch (error) {
            fastify.log.error({ err: error }, 'Unhandled error processing webhook');
            return reply.status(200).send({ status: 'ok' });
        }
    });
    // ─── Razorpay Webhook ───────────────────────────────────────────────────
    fastify.post('/razorpay', async (request, reply) => {
        const signature = request.headers['x-razorpay-signature'];
        if (!signature) {
            fastify.log.warn('Missing Razorpay webhook signature');
            return reply.status(401).send('Missing signature');
        }
        const rawBody = JSON.stringify(request.body);
        const isValid = (0, razorpay_1.verifyWebhookSignature)(rawBody, signature);
        if (!isValid) {
            fastify.log.warn('Invalid Razorpay webhook signature');
            return reply.status(401).send('Invalid signature');
        }
        const event = request.body?.event;
        const payload = request.body?.payload;
        if (!event || !payload) {
            fastify.log.warn('Invalid Razorpay webhook payload');
            return reply.status(400).send('Invalid payload');
        }
        fastify.log.info(`Razorpay webhook event: ${event}`);
        try {
            switch (event) {
                case 'payment.captured': {
                    const payment = payload.payment?.entity;
                    if (!payment)
                        break;
                    const { data: subData } = await supabase_1.supabase
                        .from('businesses')
                        .select('id')
                        .eq('razorpay_subscription_id', payment.subscription_id)
                        .maybeSingle();
                    const businessId = subData?.id || payment.notes?.business_id;
                    if (businessId) {
                        await supabase_1.supabase.from('payment_transactions').insert({
                            business_id: businessId,
                            razorpay_payment_id: payment.id,
                            razorpay_subscription_id: payment.subscription_id,
                            razorpay_order_id: payment.order_id,
                            amount: (payment.amount || 0) / 100,
                            status: 'captured',
                            method: payment.method,
                            upi_id: payment.vpa || null,
                            bank_transaction_id: payment.acquirer_data?.bank_transaction_id || null,
                        });
                        if (payment.notes?.invoice_id) {
                            await supabase_1.supabase
                                .from('invoices')
                                .update({ status: 'paid', updated_at: new Date().toISOString() })
                                .eq('id', payment.notes.invoice_id);
                        }
                    }
                    break;
                }
                case 'subscription.activated': {
                    const subscription = payload.subscription?.entity;
                    if (!subscription?.id)
                        break;
                    const { activateSubscription } = await Promise.resolve().then(() => __importStar(require('../services/subscription-manager')));
                    await activateSubscription(subscription.id);
                    break;
                }
                case 'subscription.charged': {
                    const charge = payload.subscription?.entity;
                    if (!charge?.id)
                        break;
                    fastify.log.info(`Subscription renewed: ${charge.id}`);
                    break;
                }
                case 'subscription.cancelled': {
                    const cancelledSub = payload.subscription?.entity;
                    if (!cancelledSub?.id)
                        break;
                    const { cancelSubscription } = await Promise.resolve().then(() => __importStar(require('../services/subscription-manager')));
                    await cancelSubscription(cancelledSub.id);
                    break;
                }
                case 'payment.failed': {
                    const failedPayment = payload.payment?.entity;
                    const { data: failedBusiness } = await supabase_1.supabase
                        .from('businesses')
                        .select('id')
                        .eq('razorpay_subscription_id', failedPayment?.subscription_id)
                        .maybeSingle();
                    if (failedBusiness) {
                        const { handlePaymentFailed } = await Promise.resolve().then(() => __importStar(require('../services/subscription-manager')));
                        await handlePaymentFailed(failedBusiness.id, failedPayment?.error_reason);
                    }
                    break;
                }
                default:
                    fastify.log.info(`Unhandled Razorpay event: ${event}`);
            }
        }
        catch (error) {
            fastify.log.error({ err: error, event }, `Error handling Razorpay event ${event}`);
        }
        return reply.status(200).send({ status: 'ok' });
    });
}
