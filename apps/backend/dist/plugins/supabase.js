import dotenv from "dotenv";
dotenv.config();
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}
export const supabase = createClient(supabaseUrl, supabaseKey);
const supabasePlugin = async (fastify) => {
    fastify.decorate('supabase', supabase);
    try {
        const { error } = await supabase.from('businesses').select('count').limit(1);
        if (error) {
            fastify.log.error({ err: error }, 'Supabase connection failed');
        }
        else {
            fastify.log.info('Supabase connected successfully');
        }
    }
    catch (err) {
        fastify.log.error({ err }, 'Supabase connection test failed');
    }
};
export default supabasePlugin;
