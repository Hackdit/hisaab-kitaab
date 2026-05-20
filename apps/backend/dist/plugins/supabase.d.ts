import { FastifyPluginAsync } from 'fastify';
import { SupabaseClient } from '@supabase/supabase-js';
declare module 'fastify' {
    interface FastifyInstance {
        supabase: SupabaseClient;
    }
}
export declare const supabase: SupabaseClient;
declare const supabasePlugin: FastifyPluginAsync;
export default supabasePlugin;
