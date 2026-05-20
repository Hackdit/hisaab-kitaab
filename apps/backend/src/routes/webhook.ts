import { FastifyInstance } from 'fastify';
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

let twilioClient: ReturnType<typeof Twilio> | null = null;

function getTwilioClient(): ReturnType<typeof Twilio> {
  if (!twilioClient) {
    twilioClient = Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
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

export async function webhookRoutes(fastify: FastifyInstance) {
  // Twilio webhook verification (GET)
  fastify.get('/whatsapp', async (request, reply) => {
    const query = request.query as Record<string, string>;
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
    try {
      // Verify Twilio signature (skipped in development for ngrok)
      const twilioSignature = request.headers['x-twilio-signature'] as string;
      const url = `${request.protocol}://${request.hostname}/webhook/whatsapp`;
      if (process.env.NODE_ENV === 'production' && twilioSignature) {
        const isValid = Twilio.validateRequest(
          process.env.TWILIO_AUTH_TOKEN!,
          twilioSignature,
          url,
          request.body as Record<string, string>
        );
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
      console.log('WEBHOOK: Message received', { from: payload.From, body: payload.Body });

      const fromNumber = payload.From.replace('whatsapp:', '');
      console.log('WEBHOOK: From number', fromNumber);
      console.log('REDIS KEY READ:', `whatsapp:state:${fromNumber}`);
      const messageBody = payload.Body ?? '';
      const numMedia = payload.NumMedia;
      const mediaContentType = payload.MediaContentType0;
      const mediaUrl = payload.MediaUrl0;

      let messageText = messageBody;

      // Transcribe audio via Whisper
      if (numMedia > 0 && mediaContentType?.startsWith('audio/')) {
        try {
          const response = await fetch(mediaUrl!, {
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
        } catch (error) {
          fastify.log.error({ err: error }, 'Error transcribing audio');
          return reply.status(200).header('Content-Type', 'text/xml').send('<Response></Response>');
        }
      }

      // Load Redis state
      const stateKey = `whatsapp:state:${fromNumber}`;
      let state: any = null;
      try {
        const raw = await redis.get(stateKey);
        if (raw) {
          // @upstash/redis already parses JSON automatically
          // so raw is already an object, not a string
          state = typeof raw === 'string' ? JSON.parse(raw) : raw;
          console.log('REDIS LOADED STATE:', state);
        }
      } catch (err) {
        console.error('REDIS READ ERROR:', err);
      }

      // Look up business by the sender's number
      let business: any = null;
      try {
        const { data } = await supabase
          .from('businesses')
          .select('*')
          .eq('whatsapp_number', fromNumber)
          .single();
        business = data;
      } catch {
        // no matching business — will trigger onboarding
      }
      console.log('WEBHOOK: Business found', business ? business.id : 'NOT FOUND');

      // No business → onboarding
      if (!business) {
        console.log('WEBHOOK: Starting onboarding');
        const result = await handleOnboarding(fromNumber, messageText, state);
        console.log('WEBHOOK: Onboarding result', result);
        if (result?.state) {
          await redis.set(stateKey, JSON.stringify(result.state), { ex: 86400 });
        }
        return reply.status(200).header('Content-Type', 'text/xml').send('<Response></Response>');
      }

      // Business exists but no Redis state — initialize
      if (business && !state) {
        state = {
          step: 'complete',
          businessName: business.business_name,
          gstin: business.gstin,
        };
        await redis.set(stateKey, state, { ex: 86400 });
        console.log('INITIALIZED MISSING REDIS STATE for existing business');
      }

      // ── Debug: invoice flow state ──
      console.log('FULL REDIS STATE:', JSON.stringify(state));
      console.log('INVOICE FLOW ACTIVE:', state?.invoiceFlow?.active);

      // ── Active invoice flow — bypass NLP ──
      if (state?.invoiceFlow?.active) {
        console.log('ACTIVE INVOICE FLOW, step:', state.invoiceFlow.step);
        const result = await handleInvoiceFlow(
          fromNumber,
          messageText,
          {},
          state,
          business
        );
        if (result?.state) {
          await redis.set(stateKey, JSON.stringify(result.state), { ex: 86400 });
        }
        return reply.status(200).header('Content-Type', 'text/xml').send('<Response></Response>');
      }

      // NLP
      const nlpResult = await processNlp({
        text: messageText,
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
      let handlerResult: { state: any } | undefined;

      switch (intent) {
        case 'onboarding':
          handlerResult = await handleOnboarding(fromNumber, messageText, state);
          break;
        case 'create_invoice':
        case 'invoice':
          handlerResult = await handleInvoiceFlow(fromNumber, messageText, entities, state, business);
          break;
        case 'record_payment':
          if (looksLikeBankSms(messageText)) {
            await reconcilePayment(fromNumber, business.id, messageText);
            return reply.status(200).header('Content-Type', 'text/xml').send('<Response></Response>');
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
          await handleSubscribeIntent(fromNumber, business.id, business.name || business.business_name, entities.plan as string | undefined);
          return reply.status(200).header('Content-Type', 'text/xml').send('<Response></Response>');
        case 'reconciliation':
          await reconcilePayment(fromNumber, business.id, messageText);
          return reply.status(200).header('Content-Type', 'text/xml').send('<Response></Response>');
        case 'check_udhaar':
        case 'send_reminder':
        case 'update_customer':
        case 'check_gst':
        case 'cancel_invoice':
        case 'help':
          await sendTextMessage(fromNumber, nlpResult.response);
          break;
        default:
          await sendTextMessage(
            fromNumber,
            nlpResult.response ||
              "I'm not sure how to help with that. Please try rephrasing."
          );
      }

      // Update Redis state if handler returned one
      if (handlerResult?.state) {
        await redis.set(stateKey, JSON.stringify(handlerResult.state), { ex: 86400 });
      }

      return reply.status(200).header('Content-Type', 'text/xml').send('<Response></Response>');
    } catch (error) {
      fastify.log.error({ err: error }, 'Unhandled error processing webhook');
      return reply.status(200).header('Content-Type', 'text/xml').send('<Response></Response>');
    }
  });

  // ─── Razorpay Webhook ───────────────────────────────────────────────────
  fastify.post('/razorpay', async (request, reply) => {
    const signature = request.headers['x-razorpay-signature'] as string;
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

    const event = (request.body as any)?.event;
    const payload = (request.body as any)?.payload;

    if (!event || !payload) {
      fastify.log.warn('Invalid Razorpay webhook payload');
      return reply.status(400).send('Invalid payload');
    }

    fastify.log.info(`Razorpay webhook event: ${event}`);

    try {
      switch (event) {
        case 'payment.captured': {
          const payment = payload.payment?.entity;
          if (!payment) break;

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
          if (!subscription?.id) break;

          const { activateSubscription } = await import('../services/subscription-manager');
          await activateSubscription(subscription.id);
          break;
        }

        case 'subscription.charged': {
          const charge = payload.subscription?.entity;
          if (!charge?.id) break;

          fastify.log.info(`Subscription renewed: ${charge.id}`);
          break;
        }

        case 'subscription.cancelled': {
          const cancelledSub = payload.subscription?.entity;
          if (!cancelledSub?.id) break;

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
    } catch (error) {
      fastify.log.error({ err: error, event }, `Error handling Razorpay event ${event}`);
    }

    return reply.status(200).send({ status: 'ok' });
  });
}