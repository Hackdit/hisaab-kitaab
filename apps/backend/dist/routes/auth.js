"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const zod_1 = require("zod");
const supabase_1 = require("../plugins/supabase");
const whatsapp_1 = require("../services/whatsapp");
const otpRequestSchema = zod_1.z.object({
    phone: zod_1.z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
});
const otpVerifySchema = zod_1.z.object({
    phone: zod_1.z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
    otp: zod_1.z.string().length(6, 'OTP must be 6 digits'),
});
const otpStore = new Map();
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
async function authRoutes(fastify) {
    fastify.post('/otp', async (request, reply) => {
        const parsed = otpRequestSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
        }
        const { phone } = parsed.data;
        const otp = generateOtp();
        otpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
        try {
            await (0, whatsapp_1.sendTextMessage)(phone, `Your Hisab-Kitaab OTP is: ${otp}. Valid for 5 minutes.`);
            return reply.send({ message: 'OTP sent successfully' });
        }
        catch (error) {
            fastify.log.error({ err: error }, 'Failed to send OTP WhatsApp message');
            return reply.status(500).send({ error: 'Failed to send OTP' });
        }
    });
    fastify.post('/verify', async (request, reply) => {
        const parsed = otpVerifySchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
        }
        const { phone, otp } = parsed.data;
        const stored = otpStore.get(phone);
        if (!stored) {
            return reply.status(400).send({ error: 'No OTP requested for this number' });
        }
        if (Date.now() > stored.expiresAt) {
            otpStore.delete(phone);
            return reply.status(400).send({ error: 'OTP has expired' });
        }
        if (stored.otp !== otp) {
            return reply.status(400).send({ error: 'Invalid OTP' });
        }
        otpStore.delete(phone);
        // Create or sign in Supabase user
        const { data: authData, error: authError } = await supabase_1.supabase.auth.admin.createUser({
            phone,
            phone_confirm: true,
        });
        if (authError) {
            if (authError.message.includes('already exists')) {
                // User exists — sign them in
                const { data: signInData, error: signInError } = await supabase_1.supabase.auth.signInWithOtp({ phone });
                if (signInError) {
                    return reply.status(500).send({ error: 'Authentication failed' });
                }
                return reply.send({
                    message: 'OTP verified',
                    token: signInData?.session?.access_token || null,
                });
            }
            return reply.status(500).send({ error: 'Failed to create user' });
        }
        return reply.send({
            message: 'OTP verified',
            token: authData?.session?.access_token || null,
        });
    });
}
