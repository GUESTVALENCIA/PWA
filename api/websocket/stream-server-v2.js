/**
 * WebSocket Enterprise Stream Server v2
 * =====================================
 * PIPELINE CORRECTO (Sonnet 4.5):
 *
 * Audio Usuario (STREAMING)
 *     ↓
 * Deepgram STT (STREAMING + VAD + Endpointing)
 *     ↓
 * LLM Streaming (Groq/Claude/Gemini/OpenAI)
 *     ↓
 * Voice Library Manager (Sandra.mp3 pregrabada)
 *     ↓
 * Cliente (sin ecos, sin ruido, SIN molestias)
 */

const WebSocket = require('ws');
const { Deepgram } = require('@deepgram/sdk');
const OpenAI = require('openai');

// LLM Providers
let AnthropicClient = null;
let GroqClient = null;
let GoogleGenAI = null;

try {
  const Anthropic = require('@anthropic-ai/sdk');
  AnthropicClient = Anthropic.default || Anthropic;
} catch (e) {
  console.log('[STREAM] ℹ️ Anthropic SDK not installed');
}

try {
  const Groq = require('groq-sdk');
  GroqClient = Groq;
} catch (e) {
  console.log('[STREAM] ℹ️ Groq SDK not installed');
}

try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  GoogleGenAI = GoogleGenerativeAI;
} catch (e) {
  console.log('[STREAM] ℹ️ Google SDK not installed');
}

/**
 * Get available providers based on API keys
 */
function getAvailableProviders() {
  const providers = ['openai'];
  if (process.env.GROQ_API_KEY && GroqClient) providers.push('groq');
  if (process.env.ANTHROPIC_API_KEY && AnthropicClient) providers.push('anthropic');
  if (process.env.GEMINI_API_KEY && GoogleGenAI) providers.push('gemini');
  return providers;
}

/**
 * STREAMING LLM Router
 */
async function getLLMResponse(provider, conversationHistory, systemMessage) {
  switch (provider) {
    case 'groq':
      return getGroqResponse(conversationHistory, systemMessage);
    case 'anthropic':
      return getAnthropicResponse(conversationHistory, systemMessage);
    case 'gemini':
      return getGeminiResponse(conversationHistory, systemMessage);
    case 'openai':
    default:
      return getOpenAIResponse(conversationHistory, systemMessage);
  }
}

async function getOpenAIResponse(conversationHistory, systemMessage) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemMessage },
      ...conversationHistory
    ],
    stream: true,
    temperature: 0.7,
    max_tokens: 500
  });
}

async function getGroqResponse(conversationHistory, systemMessage) {
  if (!GroqClient) throw new Error('Groq not available');
  const groq = new GroqClient({ apiKey: process.env.GROQ_API_KEY });
  return await groq.chat.completions.create({
    model: 'mixtral-8x7b-32768',
    messages: [
      { role: 'system', content: systemMessage },
      ...conversationHistory
    ],
    stream: true,
    temperature: 0.7,
    max_tokens: 500
  });
}

async function getAnthropicResponse(conversationHistory, systemMessage) {
  if (!AnthropicClient) throw new Error('Anthropic not available');
  const anthropic = new AnthropicClient({ apiKey: process.env.ANTHROPIC_API_KEY });
  return await anthropic.messages.stream({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 500,
    system: systemMessage,
    messages: conversationHistory
  });
}

async function getGeminiResponse(conversationHistory, systemMessage) {
  if (!GoogleGenAI) throw new Error('Gemini not available');
  const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  return await model.generateContentStream({
    contents: [
      { role: 'user', content: systemMessage },
      ...conversationHistory
    ]
  });
}

/**
 * MAIN: Initialize WebSocket with Deepgram STREAMING + VAD
 */
module.exports = (server) => {
  const wss = new WebSocket.Server({ server, path: '/ws/stream' });

  wss.on('connection', (ws) => {
    console.log('[STREAM] ✅ Cliente conectado');

    const client = {
      id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      connectedAt: new Date(),
      conversationHistory: [],
      isProcessing: false,
      language: 'es',
      llmProvider: process.env.DEFAULT_LLM_PROVIDER || 'openai',
      availableProviders: getAvailableProviders(),

      // 🎙️ STREAMING STT CON VAD
      deepgramConnection: null,
      audioBuffer: Buffer.alloc(0),
      isListening: false,
      lastAudioTime: Date.now(),
      vadTimeout: 400 // ms de silencio para fin de frase
    };

    // Enviar confirmación con proveedores
    ws.send(JSON.stringify({
      type: 'connection',
      status: 'connected',
      clientId: client.id,
      availableProviders: client.availableProviders,
      defaultProvider: client.llmProvider,
      message: 'WebSocket Enterprise Stream v2 - PIPELINE CORRECTO'
    }));

    /**
     * Procesar mensajes del cliente
     */
    ws.on('message', async (data) => {
      try {
        if (typeof data === 'string') {
          const msg = JSON.parse(data);
          await handleControlMessage(msg, ws, client);
        } else if (Buffer.isBuffer(data)) {
          // 🎙️ Audio del usuario - ENVIAR A DEEPGRAM STREAMING
          await processAudioStream(data, ws, client);
        }
      } catch (err) {
        console.error('[STREAM] ❌ Error:', err.message);
        ws.send(JSON.stringify({
          type: 'error',
          message: err.message
        }));
      }
    });

    ws.on('close', () => {
      console.log('[STREAM] ❌ Cliente desconectado:', client.id);
      if (client.deepgramConnection) {
        client.deepgramConnection.finish();
      }
    });
  });

  /**
   * CONTROL MESSAGES
   */
  async function handleControlMessage(msg, ws, client) {
    switch (msg.type) {
      case 'setLanguage':
        client.language = msg.language || 'es';
        ws.send(JSON.stringify({ type: 'languageSet', language: client.language }));
        break;

      case 'setProvider':
        if (client.availableProviders.includes(msg.provider)) {
          client.llmProvider = msg.provider;
          ws.send(JSON.stringify({ type: 'providerSet', provider: client.llmProvider }));
        }
        break;

      case 'startListening':
        client.isListening = true;
        console.log('[STREAM] 🎙️ Iniciando escucha...');
        break;

      case 'stopListening':
        client.isListening = false;
        console.log('[STREAM] ⏹️ Deteniendo escucha');
        break;

      case 'getStatus':
        ws.send(JSON.stringify({
          type: 'status',
          clientId: client.id,
          llmProvider: client.llmProvider,
          availableProviders: client.availableProviders,
          isListening: client.isListening,
          isProcessing: client.isProcessing
        }));
        break;
    }
  }

  /**
   * DEEPGRAM STREAMING + VAD (Voice Activity Detection)
   * CRÍTICO: Esto es lo que falta en la versión anterior
   */
  async function processAudioStream(audioBuffer, ws, client) {
    if (!client.isListening) return;

    try {
      // Si no hay conexión Deepgram abierta, crear una NUEVA
      if (!client.deepgramConnection) {
        console.log('[DEEPGRAM] 🔌 Abriendo conexión STREAMING...');

        const deepgram = new Deepgram({ apiKey: process.env.DEEPGRAM_API_KEY });

        client.deepgramConnection = await deepgram.transcription.live({
          model: 'nova-2',
          language: client.language,
          punctuate: true,
          interim_results: true, // ← CRÍTICO: Resultados parciales en tiempo real
          endpointing: 300, // ← CRÍTICO: Detecta 300ms de silencio = FIN DE FRASE
          vad_events: true, // ← CRÍTICO: Voice Activity Detection
          smart_format: true
        });

        let fullTranscript = '';
        let isProcessing = false;

        // Escuchar eventos de Deepgram
        client.deepgramConnection.on('transcriptionFinalized', async (msg) => {
          console.log('[DEEPGRAM] ✅ Frase terminada (VAD detected silence)');

          const transcript = msg.channel.alternatives[0]?.transcript;
          if (!transcript) return;

          fullTranscript = transcript;
          console.log('[DEEPGRAM] 📝 Transcripción final:', fullTranscript);

          // Enviar transcripción al cliente
          ws.send(JSON.stringify({
            type: 'transcription',
            text: fullTranscript,
            language: client.language
          }));

          // Procesar con LLM
          if (!isProcessing) {
            isProcessing = true;
            await processWithLLM(fullTranscript, ws, client);
            isProcessing = false;
            fullTranscript = '';
          }
        });

        client.deepgramConnection.on('transcriptionUpdated', (msg) => {
          const interim = msg.channel.alternatives[0]?.transcript;
          if (interim) {
            // Enviar transcripción parcial para feedback en tiempo real
            ws.send(JSON.stringify({
              type: 'transcription_interim',
              text: interim
            }));
          }
        });

        client.deepgramConnection.on('error', (err) => {
          console.error('[DEEPGRAM] ❌ Error:', err);
          client.deepgramConnection = null;
        });

        client.deepgramConnection.on('close', () => {
          console.log('[DEEPGRAM] 🔌 Conexión cerrada');
          client.deepgramConnection = null;
        });
      }

      // Enviar audio a Deepgram
      client.deepgramConnection.send(audioBuffer);
      client.lastAudioTime = Date.now();

    } catch (err) {
      console.error('[DEEPGRAM] ❌ Error procesando audio:', err.message);
      client.deepgramConnection = null;
    }
  }

  /**
   * PROCESAR CON LLM STREAMING
   */
  async function processWithLLM(transcript, ws, client) {
    if (client.isProcessing) return;
    client.isProcessing = true;

    try {
      console.log('[LLM] 🤖 Procesando con', client.llmProvider.toUpperCase());

      // Agregar a historial
      client.conversationHistory.push({
        role: 'user',
        content: transcript
      });

      const systemMessage = `Eres Sandra, asistente de GuestsValencia. Responde en ${client.language === 'es' ? 'español' : 'inglés'} de forma natural y concisa.`;

      // Obtener streaming del LLM
      const stream = await getLLMResponse(client.llmProvider, client.conversationHistory, systemMessage);

      let fullResponse = '';
      let chunkCount = 0;

      // Manejo específico de cada proveedor
      if (client.llmProvider === 'anthropic') {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const text = event.delta.text || '';
            if (text) {
              fullResponse += text;
              chunkCount++;
              ws.send(JSON.stringify({
                type: 'response_chunk',
                text: text,
                sequence: chunkCount
              }));
            }
          }
        }
      } else if (client.llmProvider === 'gemini') {
        for await (const chunk of stream) {
          const text = chunk.text || '';
          if (text) {
            fullResponse += text;
            chunkCount++;
            ws.send(JSON.stringify({
              type: 'response_chunk',
              text: text,
              sequence: chunkCount
            }));
          }
        }
      } else {
        // OpenAI y Groq
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) {
            fullResponse += text;
            chunkCount++;
            ws.send(JSON.stringify({
              type: 'response_chunk',
              text: text,
              sequence: chunkCount
            }));
          }
        }
      }

      // Agregar respuesta al historial
      client.conversationHistory.push({
        role: 'assistant',
        content: fullResponse
      });

      // Detectar tipo de respuesta para seleccionar voz
      let responseType = 'general';
      const lower = fullResponse.toLowerCase();
      if (lower.includes('bienvenid')) responseType = 'welcome';
      else if (lower.includes('lujo') || lower.includes('premium')) responseType = 'luxury';
      else if (lower.includes('error') || lower.includes('problema')) responseType = 'error';
      else if (lower.includes('ayuda') || lower.includes('soporte')) responseType = 'support';

      console.log('[LLM] ✅ Respuesta completada:', fullResponse.substring(0, 80) + '...');

      // ENVIAR A VOICE LIBRARY MANAGER (Sandra.mp3 pregrabada)
      ws.send(JSON.stringify({
        type: 'response_complete',
        text: fullResponse,
        responseType: responseType,
        language: client.language,
        totalChunks: chunkCount
      }));

    } catch (err) {
      console.error('[LLM] ❌ Error:', err.message);
      ws.send(JSON.stringify({
        type: 'error',
        message: `Error LLM: ${err.message}`
      }));
    } finally {
      client.isProcessing = false;
    }
  }

  console.log('[STREAM] ✅ WebSocket Enterprise Stream v2 inicializado (PIPELINE CORRECTO)');
  return wss;
};
