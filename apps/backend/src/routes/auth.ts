import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { supabase } from '../plugins/supabase';
import { sendTextMessage } from '../services/whatsapp';

const otpRequestSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
});

const otpVerifySchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const otpStore = new Map<string, { otp: string; expiresAt: number }>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/otp', async (request, reply) => {
    const parsed = otpRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const { phone } = parsed.data;
    const otp = generateOtp();

    otpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    try {
      await sendTextMessage(phone, `Your Hisab-Kitaab OTP is: ${otp}. Valid for 5 minutes.`);
      return reply.send({ message: 'OTP sent successfully' });
    } catch (error) {
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
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      phone,
      phone_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already exists')) {
        // User exists — sign them in
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithOtp({ phone });
        if (signInError) {
          return reply.status(500).send({ error: 'Authentication failed' });
        }
        return reply.send({
          message: 'OTP verified',
          token: (signInData?.session as any)?.access_token || null,
        });
      }
      return reply.status(500).send({ error: 'Failed to create user' });
    }

    return reply.send({
      message: 'OTP verified',
      token: (authData as any)?.session?.access_token || null,
    });
  });
}