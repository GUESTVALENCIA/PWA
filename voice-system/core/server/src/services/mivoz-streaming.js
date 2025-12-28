/**
 * MiVoz Streaming Service
 * Native voice synthesis with WebSocket streaming
 *
 * Features:
 * - WebSocket streaming (real-time TTS)
 * - HTTP fallback (if WS unavailable)
 * - Raw PCM output (zero-copy playback)
 * - Error handling + retries
 * - Latency optimization (<300ms)
 *
 * Usage:
 * const mivoz = new MiVozStreamingService(config);
 * for await (const audioChunk of mivoz.streamAudio(textStream)) {
 *   send(audioChunk);
 * }
 */

const WebSocket = require('ws');
const https = require('https');
const { logger } = require('../utils/logger');

class MiVozStreamingService {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.MIVOZ_API_KEY;
    this.voiceId = config.voiceId || process.env.MIVOZ_VOICE_ID || 'sandra-es';
    this.model = config.model || 'mivoz-native-v1';
    this.sampleRate = config.sampleRate || 24000;
    this.language = config.language || 'es';

    // Feature detection
    this.supportsWebSocket = config.supportsWebSocket !== false;
    this.supportsHTTP = true;

    this.maxRetries = 3;
    this.retryDelay = 1000; // ms

    if (!this.apiKey) {
      logger.warn('⚠️  MiVoz API key not configured. TTS may be unavailable.');
    }
  }

  /**
   * Main streaming method
   * Yields audio chunks as they arrive from TTS service
   */
  async *streamAudio(textStream, options = {}) {
    const startTime = Date.now();
    const requestId = `tts-${Date.now()}`;

    try {
      logger.info(`🔊 MiVoz TTS starting (${requestId})`);

      if (this.supportsWebSocket) {
        yield* await this.streamViaWebSocket(textStream, options);
      } else {
        yield* await this.streamViaHTTP(textStream, options);
      }

      const latency = Date.now() - startTime;
      logger.info(`✅ MiVoz TTS complete in ${latency}ms (${requestId})`);

    } catch (error) {
      logger.error(`❌ MiVoz TTS error (${requestId}):`, error.message);
      throw error;
    }
  }

  /**
   * WebSocket streaming (preferred)
   * Maintains persistent connection, minimum latency
   */
  async *streamViaWebSocket(textStream, options = {}) {
    const wsUrl = `wss://api.mivoz.com/tts/stream?api_key=${this.apiKey}`;

    return new Promise(async (resolve, reject) => {
      let ws = null;
      let connectionReady = false;
      let isComplete = false;
      let audioQueue = [];
      let audioResolver = null;
      let wsError = null;

      try {
        ws = new WebSocket(wsUrl);
        ws.binaryType = 'arraybuffer';

        ws.on('error', (err) => {
          logger.error('MiVoz WebSocket error:', err.message);
          wsError = err;
          if (audioResolver) {
            audioResolver();
          }
        });

        ws.on('open', () => {
          logger.debug('🔗 MiVoz WebSocket connected');

          // Send configuration
          ws.send(JSON.stringify({
            voice_id: this.voiceId,
            model: this.model,
            output_format: {
              encoding: 'pcm_s16le',    // Raw PCM (optimal)
              sample_rate: this.sampleRate,
              channels: 1
            },
            language: this.language
          }));

          connectionReady = true;

          // Feed text chunks from LLM stream
          (async () => {
            try {
              for await (const chunk of textStream) {
                if (connectionReady && ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({
                    text: chunk,
                    continue: true
                  }));
                }
              }

              // Signal end of input
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  text: '',
                  continue: false
                }));
                isComplete = true;
                if (audioResolver) {
                  audioResolver();
                }
              }
            } catch (err) {
              logger.error('Error feeding text to MiVoz:', err);
              wsError = err;
            }
          })();
        });

        ws.on('message', (data) => {
          if (data instanceof Buffer || data instanceof ArrayBuffer) {
            audioQueue.push(Buffer.from(data));
            if (audioResolver) {
              audioResolver();
              audioResolver = null;
            }
          }
        });

        ws.on('close', () => {
          logger.debug('🔌 MiVoz WebSocket closed');
          isComplete = true;
          if (audioResolver) {
            audioResolver();
          }
        });

        // Yield audio chunks as they arrive
        (async () => {
          while (!isComplete || audioQueue.length > 0 || wsError) {
            if (wsError) {
              reject(wsError);
              return;
            }

            if (audioQueue.length > 0) {
              yield audioQueue.shift();
            } else if (!isComplete) {
              await new Promise(r => {
                audioResolver = r;
                setTimeout(() => {
                  if (audioResolver === r) {
                    audioResolver = null;
                    r();
                  }
                }, 100);
              });
            }
          }

          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.close();
          }

          resolve();
        })();

      } catch (error) {
        logger.error('WebSocket streaming error:', error);
        reject(error);
      }
    });
  }

  /**
   * HTTP fallback (if WebSocket not available)
   * Single request, slightly higher latency
   */
  async *streamViaHTTP(textStream, options = {}) {
    // Accumulate text chunks
    let fullText = '';
    for await (const chunk of textStream) {
      fullText += chunk;
    }

    logger.debug(`📝 Accumulated text (${fullText.length} chars)`);

    // Make HTTP request with retries
    const audioBuffer = await this.synthesizeViaHTTWithRetry(fullText);

    // Stream audio in chunks
    const chunkSize = 8192;  // 8KB chunks
    for (let i = 0; i < audioBuffer.length; i += chunkSize) {
      yield audioBuffer.slice(i, i + chunkSize);
    }
  }

  /**
   * HTTP TTS synthesis with exponential backoff
   */
  async synthesizeViaHTTWithRetry(text) {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await this.synthesizeViaHTTP(text);
      } catch (error) {
        if (attempt < this.maxRetries - 1) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          logger.warn(`⚠️  MiVoz HTTP attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * HTTP TTS synthesis
   * Returns complete audio buffer
   */
  async synthesizeViaHTTP(text) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        text: text,
        voice_id: this.voiceId,
        model: this.model,
        output_format: 'pcm_s16le',
        sample_rate: this.sampleRate
      });

      const options = {
        hostname: 'api.mivoz.com',
        path: '/tts/synthesize',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Length': Buffer.byteLength(data)
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`MiVoz HTTP error: ${res.statusCode}`));
          return;
        }

        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('MiVoz HTTP request timeout'));
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      // Try HTTP endpoint
      await this.synthesizeViaHTTP('test');
      return { healthy: true, message: 'MiVoz service healthy' };
    } catch (error) {
      return { healthy: false, message: error.message };
    }
  }
}

module.exports = MiVozStreamingService;
