import { FastifyPluginAsync } from 'fastify';
import Redis from 'ioredis';
declare module 'fastify' {
    interface FastifyInstance {
        redis: Redis;
    }
}
export declare const redis: Redis;
declare const redisPlugin: FastifyPluginAsync;
export default redisPlugin;
