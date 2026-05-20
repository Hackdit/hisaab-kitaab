import OpenAI from 'openai';
import { writeFile, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
export async function transcribeVoiceNote(audioBuffer, mimeType = 'audio/ogg', language = 'hi') {
    const startTime = performance.now();
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const ext = extensionFromMime(mimeType);
    const tempFilePath = join(tmpdir(), `hk-voice-${randomUUID()}${ext}`);
    try {
        await writeFile(tempFilePath, audioBuffer);
        const response = await openai.audio.transcriptions.create({
            file: tempFilePath,
            model: 'whisper-1',
            language,
            prompt: 'Business invoice GST payment udhaar stock inventory customer',
            response_format: 'json',
        });
        const durationMs = Math.round(performance.now() - startTime);
        const text = (response.text || '').trim();
        return {
            text,
            durationMs,
            language,
        };
    }
    finally {
        try {
            await unlink(tempFilePath);
        }
        catch {
        }
    }
}
function extensionFromMime(mimeType) {
    const map = {
        'audio/wav': '.wav',
        'audio/wave': '.wav',
        'audio/x-wav': '.wav',
        'audio/mp3': '.mp3',
        'audio/mpeg': '.mp3',
        'audio/mp4': '.mp4',
        'audio/ogg': '.ogg',
        'audio/webm': '.webm',
        'audio/flac': '.flac',
        'audio/aac': '.aac',
        'audio/m4a': '.m4a',
    };
    return map[mimeType] || '.ogg';
}
//# sourceMappingURL=transcribe.js.map