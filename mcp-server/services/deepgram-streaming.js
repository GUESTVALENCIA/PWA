const { createClient, LiveTranscriptionEvents } = require('@deepgram/sdk');

class DeepgramStreamingService {
    constructor(apiKey) {
        if (!apiKey) throw new Error('Deepgram API Key required');
        this.client = createClient(apiKey);
        this.connection = null;
        this.keepAliveInterval = null;
    }

    startStream(onTranscript) {
        try {
            this.connection = this.client.listen.live({
                model: 'nova-2-phonecall',
                language: 'es',
                smart_format: true,
                interim_results: true,
                endpointing: 250, // Critical for natural turn-taking
                vad_events: true,
                no_delay: true,
                encoding: 'linear16', // Raw PCM
                sample_rate: 24000     // Matches client
            });

            this.connection.on(LiveTranscriptionEvents.Open, () => {
                console.log('[DEEPGRAM] Conexión establecida');

                // KeepAlive to prevent timeout
                this.connection.keepAlive();
            });

            this.connection.on(LiveTranscriptionEvents.Transcript, (data) => {
                // Deepgram returns a lot of metadata, we just need the text and 'is_final'
                const transcript = data.channel.alternatives[0].transcript;
                const isFinal = data.is_final;
                const speechFinal = data.speech_final;

                if (transcript && transcript.trim().length > 0) {
                    console.log(`[DEEPGRAM] TX: ${transcript} (Final: ${isFinal})`);
                    onTranscript({
                        text: transcript,
                        isFinal: isFinal,
                        isSpeechFinal: speechFinal
                    });
                }
            });

            this.connection.on(LiveTranscriptionEvents.Close, () => {
                console.log('[DEEPGRAM] Conexión cerrada');
                this.cleanup();
            });

            this.connection.on(LiveTranscriptionEvents.Error, (err) => {
                console.error('[DEEPGRAM] Error:', err);
            });

            return true;

        } catch (err) {
            console.error('[DEEPGRAM] Error iniciando stream:', err);
            return false;
        }
    }

    sendAudio(buffer) {
        if (this.connection && this.connection.getReadyState() === 1) { // OPEN
            this.connection.send(buffer);
        }
    }

    cleanup() {
        if (this.connection) {
            // API might differ slightly on close depending on SDK version
            try { this.connection.finish(); } catch (e) { }
            this.connection = null;
        }
    }
}

module.exports = DeepgramStreamingService;
