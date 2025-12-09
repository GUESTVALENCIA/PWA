/**
 * Voice Service - TTS/STT + Orquestador de Audio
 * Modelos: Cartesia Voice / Qwen Audio
 * Gestión de flujo de voz completo
 */

const https = require('https');

class VoiceService {
  constructor() {
    this.ready = true;
    this.activeConnections = new Map();
  }

  isReady() {
    return this.ready && !!process.env.CARTESIA_API_KEY && !!process.env.DEEPGRAM_API_KEY;
  }

  async textToSpeech(text, voiceId = null) {
    if (!process.env.CARTESIA_API_KEY) {
      throw new Error('CARTESIA_API_KEY no configurada');
    }

    const selectedVoice = voiceId || process.env.CARTESIA_VOICE_ID || 'a34aec03-0f17-4fff-903f-d9458a8a92a6';

    const response = await this.makeRequest('api.cartesia.ai', '/tts/bytes', {
      model_id: 'sonic-multilingual',
      transcript: text,
      voice: {
        mode: 'id',
        id: selectedVoice
      },
      output_format: {
        container: 'mp3',
        sample_rate: 44100
      }
    }, {
      'Cartesia-Version': '2024-06-10',
      'X-API-Key': process.env.CARTESIA_API_KEY,
      'Content-Type': 'application/json'
    });

    // Convertir ArrayBuffer a base64
    const buffer = Buffer.from(response);
    return buffer.toString('base64');
  }

  async speechToText(audioData) {
    if (!process.env.DEEPGRAM_API_KEY) {
      throw new Error('DEEPGRAM_API_KEY no configurada');
    }

    // audioData puede ser base64 string o Buffer
    let audioBuffer;
    if (typeof audioData === 'string') {
      audioBuffer = Buffer.from(audioData, 'base64');
    } else {
      audioBuffer = audioData;
    }

    const response = await this.makeRequest('api.deepgram.com', '/v1/listen?model=nova-2&language=es', 
      audioBuffer, {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/wav'
      }, 'binary');

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
          
          if (dataType === 'binary') {
            // Para respuestas binarias (audio)
            try {
              resolve(JSON.parse(buffer.toString()));
            } catch (e) {
              // Si no es JSON, devolver el buffer
              resolve(buffer);
            }
          } else {
            try {
              resolve(JSON.parse(buffer.toString()));
            } catch (e) {
              resolve(buffer); // Para respuestas de audio en bytes
            }
          }
        });
      });

      req.on('error', reject);
      
      if (dataType === 'json') {
        req.write(JSON.stringify(data));
      } else {
        req.write(data);
      }
      
      req.end();
    });
  }

  async handleWebSocket(action, payload, ws) {
    switch (action) {
      case 'tts':
        const audio = await this.textToSpeech(payload.text, payload.voiceId);
        return { audio, format: 'mp3' };
      
      case 'stt':
        const transcript = await this.speechToText(payload.audio);
        return { transcript };
      
      case 'stream':
        // Implementar streaming de audio
        return { streaming: true };
      
      default:
        return { error: 'Unknown action' };
    }
  }
}

module.exports = VoiceService;

