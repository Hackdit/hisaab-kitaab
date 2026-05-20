import { z } from 'zod';
import Twilio from 'twilio';
import OpenAI from 'openai';
import { supabase } from '../plugins/supabase';
import { redis } from '../plugins/redis';
import { sendTextMessage } from '../services/whatsapp';
import { processNlp } from '../services/nlp';
import { handleOnboarding } from '../services/conversation';
import { handleInvoiceFlow } from '../services/invoice-flow';
import { handlePaymentFlow } from '../services/payment-flow';
import { handleStockFlow } from '../services/stock-flow';
import { handleReportFlow } from '../services/report-flow';
import { handleSubscribeIntent } from '../services/subscription-manager';
import { verifyWebhookSignature } from '../services/razorpay';
import { reconcilePayment, looksLikeBankSms } from '../services/upi-reconciliation';
let twilioClient = null;
function getTwilioClient() {
    if (!twilioClient) {
        twilioClient = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    }
    return twilioClient;
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const twilioWebhookSchema = z.object({
    AccountSid: z.string(),
    MessageSid: z.string(),
    From: z.string(),
    To: z.string(),
    Body: z.string().optional().default(''),
    NumMedia: z
        .string()
        .default('0')
        .transform((val) => parseInt(val, 10)),
    MediaContentType0: z.string().optional(),
    MediaUrl0: z.string().optional(),
});
export async function webhookRoutes(fastify) {
    // Twilio webhook verification (GET)
    fastify.get('/whatsapp', async (request, reply) => {
        const query = request.query;
        const mode = query['hub.mode'];
        const challenge = query['hub.challenge'];
        const verifyToken = query['hub.verify_token'];
        if (mode === 'subscribe' && verifyToken === process.env.META_WEBHOOK_VERIFY_TOKEN) {
            return reply.type('text/plain').send(challenge);
        }
        return reply.status(403).send('Forbidden');
    });
    // WhatsApp incoming message handler (POST)
    fastify.post('/whatsapp', async (request, reply) => {
        // Verify Twilio signature
        const twilioSignature = request.headers['x-twilio-signature'];
        if (twilioSignature) {
            const url = `${request.protocol}://${request.hostname}/webhook/whatsapp`;
            const isValid = getTwilioClient().validateRequest(twilioSignature, url, request.body);
            if (!isValid) {
                fastify.log.warn('Invalid Twilio signature');
                return reply.status(403).send('Invalid signature');
            }
        }
        const parsed = twilioWebhookSchema.safeParse(request.body);
        if (!parsed.success) {
            fastify.log.error({ err: parsed.error }, 'Invalid Twilio webhook payload');
            return reply.status(400).send('Invalid payload');
        }
        const payload = parsed.data;
        const fromNumber = payload.From.replace('whatsapp:', '');
        const messageBody = payload.Body ?? '';
        const numMedia = payload.NumMedia;
        const mediaContentType = payload.MediaContentType0;
        const mediaUrl = payload.MediaUrl0;
        let messageText = messageBody;
        // Transcribe audio via Whisper
        if (numMedia > 0 && mediaContentType?.startsWith('audio/')) {
            try {
                const response = await fetch(mediaUrl, {
                    headers: {
                        Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
                    },
                });
                if (!response.ok) {
                    throw new Error(`Failed to fetch media: ${response.statusText}`);
                }
                const audioBuffer = await response.arrayBuffer();
                const file = new File([audioBuffer], 'audio.' + mediaContentType.split('/')[1], { type: mediaContentType });
                const transcription = await openai.audio.transcriptions.create({
                    file,
                    model: 'whisper-1',
                });
                messageText = transcription.text;
                fastify.log.info(`Transcribed audio: ${messageText}`);
            }
            catch (error) {
                fastify.log.error({ err: error }, 'Error transcribing audio');
                await sendTextMessage(fromNumber, 'Sorry, I could not process the audio message. Please try again or send a text message.');
                return reply.status(200).send('OK');
            }
        }
        // Load Redis state
        const stateKey = `whatsapp:state:${fromNumber}`;
        let state = null;
        try {
            const raw = await redis.get(stateKey);
            if (raw)
                state = JSON.parse(raw);
        }
        catch {
            // continue with null state
        }
        // Look up business by the sender's number
        let business = null;
        try {
            const { data } = await supabase
                .from('businesses')
                .select('*')
                .eq('whatsapp_number', fromNumber)
                .single();
            business = data;
        }
        catch {
            // no matching business — will trigger onboarding
        }
        // No business → onboarding
        if (!business) {
            const result = await handleOnboarding(fromNumber, messageText, state);
            if (result?.state) {
                await redis.set(stateKey, JSON.stringify(result.state), 'EX', 86400);
            }
            return reply.status(200).send('OK');
        }
        // NLP
        const nlpResult = await processNlp({
            text: messageText,
            state,
            business_context: { id: business.id, name: business.name, gstin: business.gstin },
        });
        const { intent, entities } = nlpResult;
        // Route by intent
        let handlerResult;
        try {
            switch (intent) {
                case 'onboarding':
                    handlerResult = await handleOnboarding(fromNumber, messageText, state);
                    break;
                case 'create_invoice':
                    handlerResult = await handleInvoiceFlow(fromNumber, messageText, entities, state, business);
                    break;
                case 'record_payment':
                    if (looksLikeBankSms(messageText)) {
                        await reconcilePayment(fromNumber, business.id, messageText);
                        return reply.status(200).send('OK');
                    }
                    handlerResult = await handlePaymentFlow(fromNumber, messageText, entities, state, business);
                    break;
                case 'add_stock':
                    handlerResult = await handleStockFlow(fromNumber, messageText, entities, state, business);
                    break;
                case 'view_report':
                    handlerResult = await handleReportFlow(fromNumber, state, business);
                    break;
                case 'subscription':
                    await handleSubscribeIntent(fromNumber, business.id, business.name || business.business_name, entities.plan);
                    return reply.status(200).send('OK');
                case 'reconciliation':
                    await reconcilePayment(fromNumber, business.id, messageText);
                    return reply.status(200).send('OK');
                case 'check_udhaar':
                case 'send_reminder':
                case 'update_customer':
                case 'check_gst':
                case 'cancel_invoice':
                case 'help':
                    await sendTextMessage(fromNumber, nlpResult.response);
                    break;
                default:
                    await sendTextMessage(fromNumber, nlpResult.response ||
                        "I'm not sure how to help with that. Please try rephrasing.");
            }
        }
        catch (error) {
            fastify.log.error({ err: error, intent }, `Error handling intent ${intent}`);
            await sendTextMessage(fromNumber, 'Sorry, there was an error processing your request. Please try again later.');
            return reply.status(200).send('OK');
        }
        // Update Redis state if handler returned one
        if (handlerResult?.state) {
            await redis.set(stateKey, JSON.stringify(handlerResult.state), 'EX', 86400);
        }
        return reply.status(200).send('OK');
    });
    // ─── Razorpay Webhook ───────────────────────────────────────────────────
    fastify.post('/razorpay', async (request, reply) => {
        const signature = request.headers['x-razorpay-signature'];
        if (!signature) {
            fastify.log.warn('Missing Razorpay webhook signature');
            return reply.status(401).send('Missing signature');
        }
        const rawBody = JSON.stringify(request.body);
        const isValid = verifyWebhookSignature(rawBody, signature);
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
                    const { data: subData } = await supabase
                        .from('businesses')
                        .select('id')
                        .eq('razorpay_subscription_id', payment.subscription_id)
                        .maybeSingle();
                    const businessId = subData?.id || payment.notes?.business_id;
                    if (businessId) {
                        await supabase.from('payment_transactions').insert({
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
                            await supabase
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
                    const { activateSubscription } = await import('../services/subscription-manager');
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
                    const { cancelSubscription } = await import('../services/subscription-manager');
                    await cancelSubscription(cancelledSub.id);
                    break;
                }
                case 'payment.failed': {
                    const failedPayment = payload.payment?.entity;
                    const { data: failedBusiness } = await supabase
                        .from('businesses')
                        .select('id')
                        .eq('razorpay_subscription_id', failedPayment?.subscription_id)
                        .maybeSingle();
                    if (failedBusiness) {
                        const { handlePaymentFailed } = await import('../services/subscription-manager');
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
