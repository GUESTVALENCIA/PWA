/**
 * WebSocket Enterprise Stream Server
 * =====================================
 * Streaming bidirectional communication with:
 * - Audio input from client (MediaRecorder)
 * - Deepgram STT (Speech-to-Text) streaming
 * - gpt-4o-mini LLM processing
 * - Text response streaming back to client
 * - Voice synthesis with native Sandra voice
 *
 * Architecture:
 * Client --[audio chunks]--> WebSocket Server
 * Server --[transcription]--> Client (display text)
 * Server --[response chunks]--> Client (streaming text + voice)
 */

const WebSocket = require('ws');
const { Deepgram } = require('@deepgram/sdk');
const OpenAI = require('openai');

// LLM Provider imports (optional, handled gracefully)
let AnthropicClient = null;
let GroqClient = null;
let GoogleGenAI = null;

try {
  const Anthropic = require('@anthropic-ai/sdk');
  AnthropicClient = Anthropic.default || Anthropic;
} catch (e) {
  console.log('[WEBSOCKET] ℹ️  Anthropic SDK not installed (optional)');
}

try {
  const Groq = require('groq-sdk');
  GroqClient = Groq;
} catch (e) {
  console.log('[WEBSOCKET] ℹ️  Groq SDK not installed (optional)');
}

try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  GoogleGenAI = GoogleGenerativeAI;
} catch (e) {
  console.log('[WEBSOCKET] ℹ️  Google Generative AI SDK not installed (optional)');
}

/**
 * Get list of available LLM providers based on installed SDKs
 */
function getAvailableProviders() {
  const providers = ['openai']; // OpenAI is always available

  if (process.env.GROQ_API_KEY && GroqClient) providers.push('groq');
  if (process.env.ANTHROPIC_API_KEY && AnthropicClient) providers.push('anthropic');
  if (process.env.GOOGLE_API_KEY && GoogleGenAI) providers.push('gemini');

  return providers;
}

/**
 * Get LLM response from the selected provider
 * @param {string} provider - LLM provider name (openai, groq, anthropic, gemini)
 * @param {array} conversationHistory - Message history
 * @param {string} systemMessage - System instructions
 * @returns {Promise<AsyncIterator>} Response stream
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

/**
 * Get response from OpenAI
 */
async function getOpenAIResponse(conversationHistory, systemMessage) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

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

/**
 * Get response from Groq (FREE TIER available)
 */
async function getGroqResponse(conversationHistory, systemMessage) {
  if (!GroqClient) throw new Error('Groq SDK not installed');

  const groq = new GroqClient({
    apiKey: process.env.GROQ_API_KEY
  });

  return await groq.chat.completions.create({
    model: 'mixtral-8x7b-32768', // Free model
    messages: [
      { role: 'system', content: systemMessage },
      ...conversationHistory
    ],
    stream: true,
    temperature: 0.7,
    max_tokens: 500
  });
}

/**
 * Get response from Anthropic
 */
async function getAnthropicResponse(conversationHistory, systemMessage) {
  if (!AnthropicClient) throw new Error('Anthropic SDK not installed');

  const anthropic = new AnthropicClient({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  return await anthropic.messages.stream({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 500,
    system: systemMessage,
    messages: conversationHistory
  });
}

/**
 * Get response from Google Gemini
 */
async function getGeminiResponse(conversationHistory, systemMessage) {
  if (!GoogleGenAI) throw new Error('Google Generative AI SDK not installed');

  const genAI = new GoogleGenAI(process.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const messages = [
    { role: 'user', content: systemMessage },
    ...conversationHistory
  ];

  return await model.generateContentStream({
    contents: messages
  });
}

/**
 * Initialize WebSocket Enterprise Stream Server
 * @param {http.Server} server - Express server instance
 */
module.exports = (server) => {
  // Validate environment variables
  if (!process.env.DEEPGRAM_API_KEY) {
    console.warn('[WEBSOCKET] ⚠️ DEEPGRAM_API_KEY not configured. Speech-to-text will fail.');
  }
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[WEBSOCKET] ⚠️ OPENAI_API_KEY not configured. Chat responses will fail.');
  }

  const wss = new WebSocket.Server({ server, path: '/ws/stream' });

  wss.on('connection', (ws) => {
    console.log('[WEBSOCKET] ✅ Cliente conectado. Total clientes:', wss.clients.size);

    // Initialize client context
    const client = {
      id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      connectedAt: new Date(),
      audioBuffer: Buffer.alloc(0),
      conversationHistory: [],
      isProcessing: false,
      language: 'es',
      llmProvider: process.env.DEFAULT_LLM_PROVIDER || 'openai', // openai, groq, anthropic, gemini
      availableProviders: getAvailableProviders()
    };

    // Send connection confirmation with available providers
    ws.send(JSON.stringify({
      type: 'connection',
      status: 'connected',
      clientId: client.id,
      availableProviders: client.availableProviders,
      defaultProvider: client.llmProvider,
      message: 'Connected to WebSocket Enterprise Stream Server'
    }));

    /**
     * Process incoming audio from client
     */
    ws.on('message', async (data) => {
      try {
        // Check if message is JSON (config/control) or binary (audio)
        if (typeof data === 'string') {
          const msg = JSON.parse(data);
          await handleControlMessage(msg, ws, client);
        } else if (Buffer.isBuffer(data)) {
          // Audio data received
          console.log('[WEBSOCKET] 🎙️  Recibido audio chunk:', data.length, 'bytes');
          await processAudioChunk(data, ws, client);
        }
      } catch (err) {
        console.error('[WEBSOCKET] Error procesando mensaje:', err.message);
        ws.send(JSON.stringify({
          type: 'error',
          message: `Error: ${err.message}`
        }));
      }
    });

    ws.on('close', () => {
      console.log('[WEBSOCKET] ❌ Cliente desconectado:', client.id, '- Total clientes:', wss.clients.size);
    });

    ws.on('error', (err) => {
      console.error('[WEBSOCKET] WebSocket error:', err.message);
    });
  });

  /**
   * Handle control messages (language, settings, etc.)
   */
  async function handleControlMessage(msg, ws, client) {
    console.log('[WEBSOCKET] 📨 Control message:', msg.type);

    switch (msg.type) {
      case 'setLanguage':
        client.language = msg.language || 'es';
        console.log('[WEBSOCKET] Idioma establecido:', client.language);
        ws.send(JSON.stringify({
          type: 'languageSet',
          language: client.language
        }));
        break;

      case 'clearHistory':
        client.conversationHistory = [];
        console.log('[WEBSOCKET] Historial de conversación borrado');
        ws.send(JSON.stringify({
          type: 'historyCleared'
        }));
        break;

      case 'setProvider':
        if (msg.provider && client.availableProviders.includes(msg.provider)) {
          client.llmProvider = msg.provider;
          console.log('[WEBSOCKET] 🔄 Proveedor LLM cambiado a:', client.llmProvider);
          ws.send(JSON.stringify({
            type: 'providerSet',
            provider: client.llmProvider
          }));
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            message: `Proveedor no válido o no disponible: ${msg.provider}`
          }));
        }
        break;

      case 'getStatus':
        ws.send(JSON.stringify({
          type: 'status',
          clientId: client.id,
          language: client.language,
          llmProvider: client.llmProvider,
          availableProviders: client.availableProviders,
          isProcessing: client.isProcessing,
          historyLength: client.conversationHistory.length,
          connectedSince: client.connectedAt
        }));
        break;

      default:
        console.warn('[WEBSOCKET] Unknown control message type:', msg.type);
    }
  }

  /**
   * Process audio chunk with Deepgram STT
   */
  async function processAudioChunk(audioBuffer, ws, client) {
    if (client.isProcessing) {
      console.log('[WEBSOCKET] ⏳ Already processing, queuing...');
      return; // Prevent concurrent processing
    }

    client.isProcessing = true;

    try {
      // 1. Transcribe audio with Deepgram
      console.log('[WEBSOCKET] 📝 Transcribiendo audio con Deepgram...');

      const deepgram = new Deepgram({
        apiKey: process.env.DEEPGRAM_API_KEY
      });

      const { result } = await deepgram.listen.prerecorded.transcribeBuffer(
        audioBuffer,
        {
          model: 'nova-2',
          language: client.language,
          smart_format: true
        }
      );

      const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
      console.log('[WEBSOCKET] ✅ Transcripción:', transcript);

      if (!transcript) {
        ws.send(JSON.stringify({
          type: 'transcription',
          text: '',
          warning: 'No speech detected'
        }));
        client.isProcessing = false;
        return;
      }

      // Send transcription to client
      ws.send(JSON.stringify({
        type: 'transcription',
        text: transcript,
        language: client.language
      }));

      // 2. Add user message to conversation history
      client.conversationHistory.push({
        role: 'user',
        content: transcript
      });

      // 3. Get response from selected LLM provider
      console.log('[WEBSOCKET] 🤖 Obteniendo respuesta de:', client.llmProvider.toUpperCase());

      // Build system message (Sandra persona)
      const systemMessage = `Eres Sandra, una asistente virtual premium para GuestsValencia, un portal de alojamientos de lujo en Valencia.
Eres amable, profesional y conocedora de Valencia.
Proporciona información sobre alojamientos, atractivos turísticos, y experiencias en Valencia.
Mantén respuestas concisas y útiles.
Idioma: ${client.language === 'es' ? 'Español (España)' : 'English'}`;

      // Create stream from selected provider
      const stream = await getLLMResponse(client.llmProvider, client.conversationHistory, systemMessage);

      // 4. Stream response back to client (handle different provider response formats)
      let fullResponse = '';
      let chunkCount = 0;

      // Handle different provider response formats
      if (client.llmProvider === 'groq') {
        // Groq uses same format as OpenAI
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
      } else if (client.llmProvider === 'anthropic') {
        // Anthropic uses different streaming format
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
        // Gemini uses different streaming format
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
        // OpenAI (default)
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

      console.log('[WEBSOCKET] ✅ Respuesta completada:', fullResponse.substring(0, 100) + '...');

      // Add assistant response to history
      client.conversationHistory.push({
        role: 'assistant',
        content: fullResponse
      });

      // 5. Detect response type for voice selection
      let responseType = 'general';
      const lowerResponse = fullResponse.toLowerCase();

      if (lowerResponse.includes('bienvenid') || lowerResponse.includes('welcome')) {
        responseType = 'welcome';
      } else if (lowerResponse.includes('lujo') || lowerResponse.includes('premium') || lowerResponse.includes('luxury')) {
        responseType = 'luxury';
      } else if (lowerResponse.includes('error') || lowerResponse.includes('problema') || lowerResponse.includes('sorry')) {
        responseType = 'error';
      } else if (lowerResponse.includes('ayuda') || lowerResponse.includes('soporte') || lowerResponse.includes('help')) {
        responseType = 'support';
      }

      // 6. Send completion signal with full response and voice info
      ws.send(JSON.stringify({
        type: 'response_complete',
        text: fullResponse,
        responseType: responseType,
        language: client.language,
        totalChunks: chunkCount
      }));

      console.log('[WEBSOCKET] 🎙️  Tipo de respuesta detectado:', responseType);

    } catch (err) {
      console.error('[WEBSOCKET] Error procesando audio:', err.message);
      ws.send(JSON.stringify({
        type: 'error',
        message: `Error procesando audio: ${err.message}`,
        details: err.message
      }));
    } finally {
      client.isProcessing = false;
    }
  }

  console.log('[WEBSOCKET] ✅ WebSocket Enterprise Stream Server inicializado (path: /ws/stream)');

  return wss;
};
