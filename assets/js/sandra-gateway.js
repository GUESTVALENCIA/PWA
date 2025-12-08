// Sandra Gateway Client - Handles communication with Netlify/Vercel API
// Connects UI to Serverless Backend

export class SandraGateway {
    constructor() {
        // Dynamic base URL detection (local vs production)
        if (window.location.hostname === 'localhost' || window.location.protocol === 'file:') {
            this.baseUrl = 'http://localhost:4040/api';
        } else {
            this.baseUrl = '/api';
        }
    }

    async sendMessage(message, role = 'hospitality') {
        try {
            const response = await fetch(`${this.baseUrl}/sandra/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, role })
            });

            if (!response.ok) throw new Error('Gateway Error');

            const data = await response.json();
            return data.reply;
        } catch (error) {
            console.error('Conversation Error:', error);
            throw error;
        }
    }

    async transcribeAudio(audioBlob) {
        const formData = new FormData();
        formData.append('audio', audioBlob);

        try {
            const response = await fetch(`${this.baseUrl}/sandra/transcribe`, {
                method: 'POST',
                body: formData // Content-Type header usually auto-set for FormData
            });

            if (!response.ok) throw new Error('Transcription Failed');

            const data = await response.json();
            return data.text;
        } catch (error) {
            console.error('STT Error:', error);
            return null;
        }
    }

    async synthesizeSpeech(text, voiceId = 'sandra-v1') {
        try {
            const response = await fetch(`${this.baseUrl}/sandra/voice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voiceId })
            });

            if (!response.ok) throw new Error('Synthesis Failed');

            // Returns audio stream or URL
            const data = await response.json();
            return data.audioContent; // Base64 or URL
        } catch (error) {
            console.error('TTS Error:', error);
            return null;
        }
    }
}
