# Hisab-Kitaab - WhatsApp Business OS for Indian MSMEs

## Tech Stack
- **Backend**: Node.js 20 + Fastify + TypeScript
- **Database**: PostgreSQL via Supabase + Redis via Upstash
- **WhatsApp**: Twilio (dev) → Meta Business API (prod)
- **AI/NLP**: Claude Sonnet 4 + OpenAI Whisper
- **PDF**: @react-pdf/renderer
- **Frontend**: Next.js 14 + Tailwind CSS + Recharts
- **Auth**: Supabase Auth (WhatsApp OTP)
- **Payments**: Razorpay Subscriptions
- **Deploy**: Railway (backend) + Vercel (frontend)
- **Monitoring**: Sentry + PostHog

## Package Manager
Use pnpm for all operations:
```bash
pnpm install
pnpm build
pnpm dev
```