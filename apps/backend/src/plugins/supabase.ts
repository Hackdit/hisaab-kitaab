import dotenv from "dotenv";
dotenv.config();
import { FastifyPluginAsync } from 'fastify';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

declare module 'fastify' {
  interface FastifyInstance {
    supabase: SupabaseClient;
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

const supabasePlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('supabase', supabase);

  try {
    const { error } = await supabase.from('businesses').select('count').limit(1);
    if (error) {
      fastify.log.error({ err: error }, 'Supabase connection failed');
    } else {
      fastify.log.info('Supabase connected successfully');
    }
  } catch (err) {
    fastify.log.error({ err }, 'Supabase connection test failed');
  }
};

export default supabasePlugin;