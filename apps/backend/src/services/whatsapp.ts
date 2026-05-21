// AiSensy WhatsApp Business API — Project API (session messages)
// Docs: aisensy.stoplight.io/docs/project-api

const AISENSY_API_TOKEN = process.env.AISENSY_API_TOKEN;

function normalizePhone(phone: string): string {
  return phone.replace(/^whatsapp:/, '').replace(/^\+/, '');
}

async function sendAiSensyPayload(payload: Record<string, unknown>): Promise<void> {
  if (!AISENSY_API_TOKEN) {
    console.error('Missing AISENSY_API_TOKEN environment variable');
    return;
  }

  const projectId = process.env.AISENSY_PROJECT_ID || '6a09c9ce6e9fd727cf01bceb';

  try {
    const response = await fetch(
      `https://apis.aisensy.com/project-apis/v1/project/${projectId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AiSensy-Project-API-Pwd': AISENSY_API_TOKEN,
        },
        body: JSON.stringify(payload),
      }
    );

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
    to: destination,
    type: 'text',
    recipient_type: 'individual',
    text: {
      body: text,
    },
  });
}

export async function sendDocument(to: string, mediaUrl: string, caption?: string): Promise<void> {
  const destination = normalizePhone(to);
  const filename = mediaUrl.split('/').pop() || 'document.pdf';

  await sendAiSensyPayload({
    to: destination,
    type: 'document',
    recipient_type: 'individual',
    document: {
      link: mediaUrl,
      filename,
    },
    ...(caption && { caption: { body: caption } }),
  });
}

export async function sendInteractiveButtons(to: string, body: string, buttons: string[]): Promise<void> {
  const buttonList = buttons.map((b, i) => `${i + 1}. ${b}`).join('\n');
  await sendTextMessage(to, `${body}\n\nPlease reply with the number of your choice:\n${buttonList}`);
}