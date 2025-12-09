/**
 * Transcriber Service
 * Speech-to-Text con Deepgram
 */

const https = require('https');

class TranscriberService {
  constructor() {
    this.ready = false;
    this.apiKey = process.env.DEEPGRAM_API_KEY;
    this.model = 'nova-2';
    this.language = 'es';
    this.initialize();
  }

  async initialize() {
    if (this.apiKey) {
      this.ready = true;
    }
  }

  isReady() {
    return this.ready;
  }

  getStatus() {
    return {
      ready: this.ready,
      model: this.model,
      language: this.language,
      hasApiKey: !!this.apiKey
    };
  }

  async transcribe(audioData) {
    if (!this.ready) {
      throw new Error('Transcriber Service no está listo. Verifica DEEPGRAM_API_KEY');
    }

    // audioData puede ser base64 string o Buffer
    let audioBuffer;
    if (typeof audioData === 'string') {
      audioBuffer = Buffer.from(audioData, 'base64');
    } else {
      audioBuffer = audioData;
    }

    const response = await this.makeRequest(
      'api.deepgram.com',
      `/v1/listen?model=${this.model}&language=${this.language}`,
      audioBuffer,
      {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'audio/wav'
      },
      'binary'
    );

    if (!response.results || !response.results.channels || !response.results.channels[0]) {
      throw new Error('Respuesta inválida de Deepgram');
    }

    return response.results.channels[0].alternatives[0].transcript;
  }

  makeRequest(hostname, path, data, headers, dataType = 'json') {
    return new Promise((resolve, reject) => {
      const options = {
        hostname,
        path,
        method: 'POST',
        headers
      };

      const req = https.request(options, (res) => {
        const chunks = [];
        
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          
          try {
            resolve(JSON.parse(buffer.toString()));
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }
}

module.exports = TranscriberService;

