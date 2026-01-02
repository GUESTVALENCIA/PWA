const config = require('../config/config');

class DeepgramService {
  constructor() {
    this.baseUrl = 'https://api.deepgram.com/v1';
  }

  async transcribeAudio(audioBase64) {
    if (!config.apiKeys.deepgram) {
      throw new Error('Deepgram API Key not configured');
    }

    const audioBuffer = Buffer.from(audioBase64, 'base64');

    // Using fetch directly because we need to send raw buffer
    const response = await fetch(`${this.baseUrl}/listen?model=nova-2&language=es&punctuate=true&smart_format=true`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${config.apiKeys.deepgram}`,
        'Content-Type': 'audio/webm',
      },
      body: audioBuffer
    });

    if (!response.ok) {
         const errorText = await response.text();
         throw new Error(`Deepgram Error: ${response.status} - ${errorText}`);
    }

    const json = await response.json();
    const transcript = json.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';

    return transcript;
  }
}

module.exports = new DeepgramService();
