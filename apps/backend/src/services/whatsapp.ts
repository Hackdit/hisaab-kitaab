import Twilio from 'twilio';

const raw = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER || '';
const TWILIO_WHATSAPP_NUMBER = raw.replace('whatsapp:', '');

let twilioClient: ReturnType<typeof Twilio> | null = null;

function getTwilioClient(): ReturnType<typeof Twilio> {
  if (!twilioClient) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) {
      throw new Error('Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN environment variables');
    }
    twilioClient = Twilio(sid, token);
  }
  return twilioClient;
}

export async function sendTextMessage(to: string, text: string): Promise<void> {
  const fromNumber = TWILIO_WHATSAPP_NUMBER;
  if (!fromNumber) {
    throw new Error('Missing TWILIO_WHATSAPP_NUMBER or TWILIO_PHONE_NUMBER environment variable');
  }
  await getTwilioClient().messages.create({
    body: text,
    from: `whatsapp:${fromNumber}`,
    to: `whatsapp:${to}`,
  });
}

export async function sendDocument(to: string, mediaUrl: string, body?: string): Promise<void> {
  const fromNumber = TWILIO_WHATSAPP_NUMBER;
  if (!fromNumber) {
    throw new Error('Missing WhatsApp number configuration');
  }
  const params: any = {
    mediaUrl: [mediaUrl],
    from: `whatsapp:${fromNumber}`,
    to: `whatsapp:${to}`,
  };
  if (body) {
    params.body = body;
  }
  await getTwilioClient().messages.create(params);
}

export async function sendInteractiveButtons(to: string, body: string, buttons: string[]): Promise<void> {
  const fromNumber = TWILIO_WHATSAPP_NUMBER;
  if (!fromNumber) {
    throw new Error('Missing WhatsApp number configuration');
  }
  const buttonList = buttons.map((b, i) => `${i + 1}. ${b}`).join('\n');
  await getTwilioClient().messages.create({
    body: `${body}\n\nPlease reply with the number of your choice:\n${buttonList}`,
    from: `whatsapp:${fromNumber}`,
    to: `whatsapp:${to}`,
  });
}