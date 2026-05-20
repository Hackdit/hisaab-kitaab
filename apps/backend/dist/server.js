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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const supabase_1 = __importDefault(require("./plugins/supabase"));
const redis_1 = __importDefault(require("./plugins/redis"));
const webhook_1 = require("./routes/webhook");
const invoices_1 = require("./routes/invoices");
const customers_1 = require("./routes/customers");
const transactions_1 = require("./routes/transactions");
const inventory_1 = require("./routes/inventory");
const gst_1 = require("./routes/gst");
const auth_1 = require("./routes/auth");
const rate_limit_1 = require("./middleware/rate-limit");
const trial_jobs_1 = require("./services/trial-jobs");
// Prevent crashes from unhandled promise rejections (e.g. Redis connection failures)
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection (non-fatal):', reason?.message || reason);
});
const server = (0, fastify_1.default)({ logger: true });
// Security
server.register(cors_1.default, { origin: true });
server.register(helmet_1.default, { contentSecurityPolicy: false });
// Database plugins
server.register(supabase_1.default);
server.register(redis_1.default);
// Rate limiting (applied to webhook only)
server.addHook('preHandler', async (request, reply) => {
    if (request.url === '/webhook/whatsapp' && request.method === 'POST') {
        await (0, rate_limit_1.rateLimitByPhone)(request, reply);
    }
});
// Routes
server.register(webhook_1.webhookRoutes, { prefix: '/webhook' });
server.register(invoices_1.invoiceRoutes, { prefix: '/api/invoices' });
server.register(customers_1.customerRoutes, { prefix: '/api/customers' });
server.register(transactions_1.transactionRoutes, { prefix: '/api/transactions' });
server.register(inventory_1.inventoryRoutes, { prefix: '/api/inventory' });
server.register(gst_1.gstRoutes, { prefix: '/api/gst' });
server.register(auth_1.authRoutes, { prefix: '/api/auth' });
// Health check
server.get('/health', async () => ({ status: 'ok' }));
// Test endpoint — full onboarding flow without WhatsApp
server.post('/test/onboarding', async (request, reply) => {
    const { phone, message } = request.body;
    // Import handlers
    const { handleOnboarding, getState } = await Promise.resolve().then(() => __importStar(require('./services/conversation')));
    // Load existing Redis state
    const currentState = await getState(phone);
    // Process message with current state
    const result = await handleOnboarding(phone, message, currentState, true);
    // Verify Redis was written by reading it back
    const { redis } = await Promise.resolve().then(() => __importStar(require('./plugins/redis')));
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
        (0, trial_jobs_1.setupAllWorkers)();
        server.log.info('Trial management workers started');
        await server.listen({ port, host: '0.0.0.0' });
        server.log.info(`Server listening on port ${port}`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
exports.default = server;
