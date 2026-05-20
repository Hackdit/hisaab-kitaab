// ──────────────────────────────────────────
// Whisper Transcription Pipeline
// Converts voice notes (audio buffers) to
// Hindi/English text via OpenAI Whisper.
// ──────────────────────────────────────────

import OpenAI from 'openai';
import { writeFile, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { TranscribeResult } from './types.js';

/**
 * Transcribe a voice note audio buffer to text using OpenAI Whisper.
 *
 * Pipeline:
 *  1. Save buffer to a temp file (wav/ogg/mp3)
 *  2. Call Whisper API with Hindi language hint
 *  3. Return transcript text
 *  4. Clean up temp file
 *
 * @param audioBuffer - Raw audio bytes from WhatsApp (AiSensy)
 * @param mimeType - MIME type of the audio (e.g., 'audio/ogg', 'audio/mp3')
 * @param language - ISO language code hint (default: 'hi' for Hindi)
 */
export async function transcribeVoiceNote(
  audioBuffer: Buffer,
  mimeType: string = 'audio/ogg',
  language: string = 'hi',
): Promise<TranscribeResult> {
  const startTime = performance.now();

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Determine file extension from MIME type
  const ext = extensionFromMime(mimeType);
  const tempFilePath = join(tmpdir(), `hk-voice-${randomUUID()}${ext}`);

  try {
    // Step 1: Write buffer to temp file
    await writeFile(tempFilePath, audioBuffer);

    // Step 2: Call Whisper
    const response = await openai.audio.transcriptions.create({
      file: tempFilePath as unknown as File,
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
  } finally {
    // Step 4: Always clean up temp file
    try {
      await unlink(tempFilePath);
    } catch {
      // Temp file cleanup is best-effort
    }
  }
}

function extensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
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