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
      // Validar que base64 no esté vacío
      if (audioData.length === 0) {
        throw new Error('Audio data is empty');
      }

      try {
        audioBuffer = Buffer.from(audioData, 'base64');
      } catch (error) {
        throw new Error(`Invalid base64 audio data: ${error.message}`);
      }

      // Validar tamaño del buffer decodificado
      if (audioBuffer.length === 0) {
        throw new Error('Decoded audio buffer is empty');
      }

      if (audioBuffer.length < 100) {
        throw new Error(`Audio buffer too small (${audioBuffer.length} bytes). Minimum 100 bytes required`);
      }
    } else {
      audioBuffer = audioData;
    }

    console.log(`[DEEPGRAM] Sending ${audioBuffer.length} bytes to Deepgram API (model: ${this.model}, language: ${this.language})`);

    // Deepgram detecta automáticamente el formato, pero especificamos webm para mayor claridad
    // ya que el widget graba en audio/webm;codecs=opus
    const response = await this.makeRequest(
      'api.deepgram.com',
      `/v1/listen?model=${this.model}&language=${this.language}&punctuate=true&smart_format=true`,
      audioBuffer,
      {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'audio/webm;codecs=opus'
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

          console.log(`[DEEPGRAM] HTTP ${res.statusCode} response received (${buffer.length} bytes)`);

          // CRITICAL FIX: Check HTTP status code BEFORE attempting to parse
          if (res.statusCode !== 200) {
            let errorMessage = `Deepgram API error (HTTP ${res.statusCode})`;
            try {
              const errorBody = JSON.parse(buffer.toString());
              errorMessage = errorBody.error?.message || errorBody.error || errorBody.message || errorMessage;
              console.error(`[DEEPGRAM] API Error: ${errorMessage}`);
            } catch (e) {
              // If error response isn't JSON, use raw text (first 200 chars)
              const rawError = buffer.toString().substring(0, 200);
              if (rawError) {
                errorMessage = `Deepgram API error (HTTP ${res.statusCode}): ${rawError}`;
              }
              console.error(`[DEEPGRAM] API Error: ${errorMessage}`);
            }
            reject(new Error(errorMessage));
            return;
          }

          // Only parse as JSON if status is 200
          try {
            resolve(JSON.parse(buffer.toString()));
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error(`[DEEPGRAM] Network error: ${error.message}`);
        reject(error);
      });

      req.write(data);
      req.end();
    });
  }
}

module.exports = TranscriberService;

