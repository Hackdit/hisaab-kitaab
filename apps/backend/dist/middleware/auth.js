"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
async function authenticate(request, reply) {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return reply.status(401).send({ error: 'Missing or invalid authorization header' });
        }
        const token = authHeader.substring(7);
        const { data, error } = await request.server.supabase.auth.getUser(token);
        if (error || !data?.user) {
            return reply.status(401).send({ error: 'Invalid or expired token' });
        }
        request.user = {
            id: data.user.id,
            email: data.user.email,
            phone: data.user.phone,
        };
    }
    catch {
        return reply.status(401).send({ error: 'Authentication failed' });
    }
}
