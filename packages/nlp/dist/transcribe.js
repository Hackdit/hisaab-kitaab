"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribeVoiceNote = transcribeVoiceNote;
const openai_1 = __importDefault(require("openai"));
const promises_1 = require("node:fs/promises");
const node_crypto_1 = require("node:crypto");
const node_path_1 = require("node:path");
const node_os_1 = require("node:os");
async function transcribeVoiceNote(audioBuffer, mimeType = 'audio/ogg', language = 'hi') {
    const startTime = performance.now();
    const openai = new openai_1.default({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const ext = extensionFromMime(mimeType);
    const tempFilePath = (0, node_path_1.join)((0, node_os_1.tmpdir)(), `hk-voice-${(0, node_crypto_1.randomUUID)()}${ext}`);
    try {
        await (0, promises_1.writeFile)(tempFilePath, audioBuffer);
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
            await (0, promises_1.unlink)(tempFilePath);
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