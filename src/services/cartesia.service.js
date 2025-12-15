const config = require('../config/config');
const { handleRequest } = require('../utils/apiClient');

class CartesiaService {
  constructor() {
    this.baseUrl = 'https://api.cartesia.ai';
    this.modelId = 'sonic-multilingual';
  }

  async generateVoice(text, voiceId = config.cartesiaVoiceId) {
    const url = `${this.baseUrl}/tts/bytes`;
    const payload = {
      model_id: this.modelId,
      transcript: text,
      voice: {
        mode: 'id',
        id: voiceId
      },
      output_format: {
        container: 'mp3',
        sample_rate: 24000
      }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Cartesia-Version': '2024-06-10',
            'X-API-Key': config.apiKeys.cartesia,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cartesia API Error: ${response.status} - ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  }
}

module.exports = new CartesiaService();
