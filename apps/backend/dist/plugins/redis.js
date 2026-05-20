import Redis from 'ioredis';
const redisUrl = process.env.UPSTASH_REDIS_URL;
if (!redisUrl) {
    throw new Error('Missing UPSTASH_REDIS_URL environment variable');
}
export const redis = (() => {
    const redisToken = process.env.UPSTASH_REDIS_TOKEN;
    if (redisToken) {
        const urlObj = new URL(redisUrl);
        urlObj.password = redisToken;
        return new Redis(urlObj.toString());
    }
    return new Redis(redisUrl);
})();
const redisPlugin = async (fastify) => {
    fastify.decorate('redis', redis);
    redis.on('connect', () => {
        fastify.log.info('Redis connected successfully');
    });
    redis.on('error', (err) => {
        fastify.log.error({ err }, 'Redis connection error');
    });
};
export default redisPlugin;
