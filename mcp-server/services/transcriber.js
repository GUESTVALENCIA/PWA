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

    // Deepgram detecta automáticamente el formato, pero especificamos webm para mayor claridad
    // ya que el widget graba en audio/webm;codecs=opus
    const response = await this.makeRequest(
      'api.deepgram.com',
      `/v1/listen?model=${this.model}&language=${this.language}&punctuate=true&smart_format=true`,
      audioBuffer,
      {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'audio/webm'
      },
      'binary'
    );

    // Validar respuesta de Deepgram con mejor manejo de errores
    if (!response || typeof response !== 'object') {
      console.error('[DEEPGRAM] Respuesta no es un objeto:', typeof response);
      throw new Error('Respuesta inválida de Deepgram: no es un objeto');
    }

    if (!response.results) {
      console.error('[DEEPGRAM] Respuesta sin results:', JSON.stringify(response).substring(0, 200));
      throw new Error('Respuesta inválida de Deepgram: sin results');
    }

    if (!response.results.channels || !Array.isArray(response.results.channels) || response.results.channels.length === 0) {
      console.error('[DEEPGRAM] Respuesta sin channels:', JSON.stringify(response.results).substring(0, 200));
      throw new Error('Respuesta inválida de Deepgram: sin channels');
    }

    if (!response.results.channels[0].alternatives || !Array.isArray(response.results.channels[0].alternatives) || response.results.channels[0].alternatives.length === 0) {
      console.error('[DEEPGRAM] Respuesta sin alternatives:', JSON.stringify(response.results.channels[0]).substring(0, 200));
      throw new Error('Respuesta inválida de Deepgram: sin alternatives');
    }

    const transcript = response.results.channels[0].alternatives[0].transcript;
    if (!transcript || typeof transcript !== 'string') {
      console.error('[DEEPGRAM] Transcript inválido:', transcript);
      throw new Error('Respuesta inválida de Deepgram: transcript no es string');
    }

    return transcript;
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

