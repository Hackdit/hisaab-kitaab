import { FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string; email?: string; phone?: string };
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
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
  } catch {
    return reply.status(401).send({ error: 'Authentication failed' });
  }
}