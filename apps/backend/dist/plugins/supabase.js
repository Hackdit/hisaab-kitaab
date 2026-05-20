"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
const supabasePlugin = async (fastify) => {
    fastify.decorate('supabase', exports.supabase);
    try {
        const { error } = await exports.supabase.from('businesses').select('count').limit(1);
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
exports.default = supabasePlugin;
