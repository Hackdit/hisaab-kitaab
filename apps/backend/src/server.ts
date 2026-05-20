import dotenv from "dotenv";
dotenv.config();
import Fastify from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import helmet from '@fastify/helmet';
import supabasePlugin from './plugins/supabase';
import redisPlugin from './plugins/redis';
import { webhookRoutes } from './routes/webhook';
import { invoiceRoutes } from './routes/invoices';
import { customerRoutes } from './routes/customers';
import { transactionRoutes } from './routes/transactions';
import { inventoryRoutes } from './routes/inventory';
import { gstRoutes } from './routes/gst';
import { authRoutes } from './routes/auth';
import { rateLimitByPhone } from './middleware/rate-limit';
import { setupAllWorkers } from './services/trial-jobs';

// Prevent crashes from unhandled promise rejections (e.g. Redis connection failures)
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection (non-fatal):', (reason as Error)?.message || reason);
});

const server = Fastify({ logger: true });

// Security
server.register(cors, { origin: true });
server.register(formbody);
server.register(helmet, { contentSecurityPolicy: false });

// Database plugins
server.register(supabasePlugin);
server.register(redisPlugin);

// Rate limiting (applied to webhook only)
server.addHook('preHandler', async (request, reply) => {
  if (request.url === '/webhook/whatsapp' && request.method === 'POST') {
    await rateLimitByPhone(request, reply);
  }
});

// Routes
server.register(webhookRoutes, { prefix: '/webhook' });
server.register(invoiceRoutes, { prefix: '/api/invoices' });
server.register(customerRoutes, { prefix: '/api/customers' });
server.register(transactionRoutes, { prefix: '/api/transactions' });
server.register(inventoryRoutes, { prefix: '/api/inventory' });
server.register(gstRoutes, { prefix: '/api/gst' });
server.register(authRoutes, { prefix: '/api/auth' });

// Health check
server.get('/health', async () => ({ status: 'ok' }));

// Test endpoint — full onboarding flow without WhatsApp
server.post('/test/onboarding', async (request, reply) => {
  const { phone, message } = request.body as { phone: string; message: string };

  // Import handlers
  const { handleOnboarding, getState } = await import('./services/conversation');

  // Load existing Redis state
  const currentState = await getState(phone);

  // Process message with current state
  const result = await handleOnboarding(phone, message, currentState, true);

  // Verify Redis was written by reading it back
  const { redis } = await import('./plugins/redis');
  const savedState = await redis.get(`whatsapp:state:${phone}`);

  return reply.send({
    success: true,
    phone,
    input_state: currentState,
    output_state: result.state,
    redis_confirmed: savedState !== null,
    redis_value: savedState,
  });
});

// Start
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);

    setupAllWorkers();
    server.log.info('Trial management workers started');

    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

export default server;