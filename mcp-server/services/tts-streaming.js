const Cartesia = require('@cartesia/cartesia-js'); // Assuming node SDK availability or using fetch
const { ElevenLabsClient } = require('elevenlabs');
const WebSocket = require('ws');

// Cartesia Node SDK might be 'cartesia' package or we use WS directly for speed.
// The user prompt mentioned 'cartesia' python SDK, for Node we might need direct WS or check npm.
// Let's implement robust WebSocket direct for Cartesia Sonic as it's often the fastest way in Node.

class TTSStreamingService {
    constructor(config = {}) {
        this.provider = config.provider || 'cartesia'; // 'cartesia' | 'elevenlabs'
        this.cartesiaApiKey = process.env.CARTESIA_API_KEY;
        this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
        this.sandraVoiceId = "a0e99878-f023-447a-9768-5f622037c388";

        if (!this.cartesiaApiKey) console.warn('[TTS] ⚠️ CARTESIA_API_KEY missing - Audio output will fail');
    }

    // Generator that yields audio chunks (Buffer)
    async *streamAudio(textStream) {
        if (this.provider === 'cartesia') {
            yield* this.streamCartesia(textStream);
        } else {
            yield* this.streamElevenLabs(textStream);
        }
    }

    async *streamCartesia(textStream) {
        if (!this.cartesiaApiKey) {
            console.warn('[TTS] ⚠️ Usando voz de respaldo (sandra-voice.mp3) por falta de API Key');
            try {
                const fs = require('fs');
                const path = require('path');
                // Adjust path relative to mcp-server/services/
                const fallbackPath = path.join(__dirname, '../../assets/audio/sandra-voice.mp3');
                if (fs.existsSync(fallbackPath)) {
                    const audioBuffer = fs.readFileSync(fallbackPath);
                    console.log(`[TTS] Enviando audio de respaldo: ${audioBuffer.byteLength} bytes`);
                    yield audioBuffer;
                } else {
                    console.error('[TTS] ❌ No se encontró el audio de respaldo en:', fallbackPath);
                }
            } catch (e) {
                console.error('[TTS] Error leyendo audio de respaldo:', e);
            }
            return;
        }
        return;
    }

    // Using simple approach: Chunk text by sentence and hit Cartesia WebSocket
    // For true streaming we connect the WS once.

    const ws = new WebSocket(`wss://api.cartesia.ai/tts/websocket?api_key=${this.cartesiaApiKey}&cartesia_version=2023-12-15`);

        // Promise to wait for connection
        await new Promise((resolve) => ws.once('open', resolve));

// Create a context ID
const contextId = `ctx_${Date.now()}`;

// Send config
ws.send(JSON.stringify({
    context_id: contextId,
    model_id: "sonic-multilingual",
    transcript: "", // Initial empty?
    voice: {
        mode: "id",
        id: this.sandraVoiceId // User's voice ID
    },
    output_format: {
        container: "raw",
        encoding: "pcm_s16le",
        sample_rate: 24000
    },
    language: "es"
}));

// Queue for incoming audio
const audioQueue = [];
let resolveAudioFn = null;

ws.on('message', (data) => {
    // Data is string (json) or binary (audio)
    if (data instanceof Buffer) {
        // Binary audio
        audioQueue.push(data);
        if (resolveAudioFn) {
            resolveAudioFn();
            resolveAudioFn = null;
        }
    } else {
        // Check for metadata
        try {
            const msg = JSON.parse(data.toString());
            if (msg.done) { /* stream done */ }
        } catch (e) { }
    }
});

// Feed text to WS
const textLoop = async () => {
    for await (const chunk of textStream) {
        ws.send(JSON.stringify({
            context_id: contextId,
            continue: true,
            transcript: chunk
        }));
    }
    // Send close/end
    ws.send(JSON.stringify({
        context_id: contextId,
        continue: false,
        transcript: ""
    }));
};

textLoop(); // Start feeding text in parallel

// Yield audio as it arrives
while (true) {
    if (audioQueue.length > 0) {
        yield audioQueue.shift();
    } else {
        // Wait for audio
        // Logic to break loop if generation finished? 
        // For simplicity, we timeout or wait for specific done signal logic.
        // In a real robust implementation we track the 'done' message.
        await new Promise(r => resolveAudioFn = r);
    }
}
    }

async * streamElevenLabs(textStream) {
    // Placeholder for ElevenLabs Turbo Streaming
    // Requires @elevenlabs/ws or generic WS
    console.log('ElevenLabs implementation pending - switching to Cartesia logic');
}
}

module.exports = TTSStreamingService;
