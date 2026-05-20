import dotenv from "dotenv";
dotenv.config();
import { FastifyPluginAsync } from 'fastify';
import { Redis } from '@upstash/redis';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Missing Upstash Redis environment variables');
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const redisPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('redis', redis);
  fastify.log.info('Upstash Redis connected');
};

export default redisPlugin;
