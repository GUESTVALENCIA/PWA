/**
 * Cartesia Service
 * Text-to-Speech con Cartesia
 * Voz de Sandra IA
 */

const https = require('https');

class CartesiaService {
  constructor() {
    this.ready = false;
    this.voiceId = process.env.CARTESIA_VOICE_ID || 'a34aec03-0f17-4fff-903f-d9458a8a92a6';
    this.model = 'sonic-multilingual';
    this.initialize();
  }

  async initialize() {
    if (process.env.CARTESIA_API_KEY) {
      this.ready = true;
    }
  }

  isReady() {
    return this.ready;
  }

  getStatus() {
    return {
      ready: this.ready,
      voiceId: this.voiceId,
      model: this.model,
      hasApiKey: !!process.env.CARTESIA_API_KEY
    };
  }

  async textToSpeech(text, voiceId = null) {
    if (!this.ready) {
      throw new Error('Cartesia Service no está listo. Verifica CARTESIA_API_KEY');
    }

    const selectedVoice = voiceId || this.voiceId;

    const response = await this.makeRequest(
      'api.cartesia.ai',
      '/tts/bytes',
      {
        model_id: this.model,
        transcript: text,
        voice: {
          mode: 'id',
          id: selectedVoice
        },
        output_format: {
          container: 'mp3',
          sample_rate: 44100
        }
      },
      {
        'Cartesia-Version': '2024-06-10',
        'X-API-Key': process.env.CARTESIA_API_KEY,
        'Content-Type': 'application/json'
      }
    );

    // Convertir ArrayBuffer a base64
    const buffer = Buffer.from(response);
    return buffer.toString('base64');
  }

  makeRequest(hostname, path, data, headers) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname,
        path,
        method: 'POST',
        headers
      };

      const req = https.request(options, (res) => {
        const chunks = [];

        console.log(`[CARTESIA] HTTP ${res.statusCode} response`);

        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);

          // CRITICAL: Validar HTTP status code ANTES de procesar
          if (res.statusCode !== 200) {
            let errorMessage = `Cartesia API error (HTTP ${res.statusCode})`;
            try {
              const errorBody = JSON.parse(buffer.toString());
              errorMessage = errorBody.error?.message || errorBody.error || errorBody.message || errorMessage;
              console.error(`[CARTESIA] API Error: ${errorMessage}`);
            } catch (e) {
              const rawError = buffer.toString().substring(0, 200);
              if (rawError) {
                errorMessage = `Cartesia API error (HTTP ${res.statusCode}): ${rawError}`;
              }
              console.error(`[CARTESIA] API Error: ${errorMessage}`);
            }
            reject(new Error(errorMessage));
            return;
          }

          // Solo procesar como audio si status es 200
          console.log(`[CARTESIA] Audio buffer recibido: ${buffer.length} bytes`);
          if (buffer.length < 100) {
            reject(new Error(`Cartesia audio buffer too small (${buffer.length} bytes)`));
            return;
          }

          resolve(buffer);
        });
      });

      req.on('error', (error) => {
        console.error(`[CARTESIA] Network error: ${error.message}`);
        reject(error);
      });

      // Timeout de 15 segundos
      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('Cartesia request timeout'));
      });

      req.write(JSON.stringify(data));
      req.end();
    });
  }
}

module.exports = CartesiaService;

