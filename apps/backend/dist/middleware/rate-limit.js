import { redis } from '../plugins/redis';
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20;
export async function rateLimitByPhone(request, reply) {
    // Extract phone from various possible sources
    let phone;
    const body = request.body;
    if (body?.From) {
        phone = body.From.replace('whatsapp:', '');
    }
    else if (request.user?.phone) {
        phone = request.user.phone;
    }
    else {
        const authBody = request.body;
        phone = authBody?.phone;
    }
    if (!phone)
        return; // Skip rate limiting if we can't identify the phone
    const key = `ratelimit:${phone}`;
    try {
        const current = await redis.incr(key);
        if (current === 1) {
            await redis.pexpire(key, WINDOW_MS);
        }
        if (current > MAX_REQUESTS) {
            const ttl = await redis.pttl(key);
            const retryAfter = Math.ceil(ttl / 1000);
            reply.header('Retry-After', String(retryAfter));
            return reply.status(429).send({
                error: `Too many requests. Max ${MAX_REQUESTS} per minute. Retry after ${retryAfter}s`,
            });
        }
        reply.header('X-RateLimit-Limit', String(MAX_REQUESTS));
        reply.header('X-RateLimit-Remaining', String(Math.max(0, MAX_REQUESTS - current)));
    }
    catch {
        // Fail open — don't block requests if Redis is down
    }
}
