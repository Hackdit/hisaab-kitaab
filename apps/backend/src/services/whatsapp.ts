// AiSensy WhatsApp Business API (production) — free-form session messages
// Docs: aisensy.stoplight.io/docs/project-api

const AISENSY_API_BASE = process.env.AISENSY_API_BASE || 'https://api.aisensy.com';
const AISENSY_API_TOKEN = process.env.AISENSY_API_TOKEN;

function normalizePhone(phone: string): string {
  return phone.replace(/^whatsapp:/, '').replace(/^\+/, '');
}

async function sendAiSensyPayload(payload: Record<string, unknown>): Promise<void> {
  if (!AISENSY_API_TOKEN) {
    console.error('Missing AISENSY_API_TOKEN environment variable');
    return;
  }

  try {
    const response = await fetch(`${AISENSY_API_BASE}/v1/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: AISENSY_API_TOKEN,
        ...payload,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error('AiSensy API error:', response.status, body);
    }
  } catch (err) {
    console.error('AiSensy send failed:', err);
  }
}

export async function sendTextMessage(to: string, text: string): Promise<void> {
  const destination = normalizePhone(to);
  await sendAiSensyPayload({
    destination,
    message: {
      type: 'text',
      text,
    },
  });
}

export async function sendDocument(to: string, mediaUrl: string, body?: string): Promise<void> {
  const destination = normalizePhone(to);
  // Derive filename from the URL or use a fallback
  const filename = mediaUrl.split('/').pop() || 'document.pdf';

  await sendAiSensyPayload({
    destination,
    message: {
      type: 'document',
      document: {
        url: mediaUrl,
        filename,
      },
      caption: body || '',
    },
  });
}

export async function sendInteractiveButtons(to: string, body: string, buttons: string[]): Promise<void> {
  const buttonList = buttons.map((b, i) => `${i + 1}. ${b}`).join('\n');
  await sendTextMessage(to, `${body}\n\nPlease reply with the number of your choice:\n${buttonList}`);
}