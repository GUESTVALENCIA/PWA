// Servidor WebSocket para Llamada Conversacional en Tiempo Real
// Se ejecuta en puerto 4041 para no interferir con el servidor HTTP

const WebSocket = require('ws');
const https = require('https');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''; // Para GPT-4o si Gemini no soporta
const GROQ_API_KEY = process.env.GROQ_API_KEY || ''; // Alternativa Groq
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || ''; // Para STT
const CARTESIA_API_KEY = process.env.CARTESIA_API_KEY;
const CARTESIA_VOICE_ID = process.env.CARTESIA_VOICE_ID;

// Reglas conversacionales
const GLOBAL_CONVERSATION_RULES = `
REGLAS CONVERSACIONALES GLOBALES (Sandra IA 8.0 Pro):
- Responde SIEMPRE en español neutro, con buena ortografía y gramática.
- Usa párrafos cortos y bien separados.
- Actúa como una experta en Hospitalidad y Turismo para Guests Valencia.
- Si te preguntan por disponibilidad, ofrece revisar datos en tiempo real.
- Brevedad estricta: máximo 4 frases salvo que se pida detalle.
- Role: luxury (Concierge)
- IMPORTANTE: Sandra SÍ puede realizar llamadas de voz conversacionales en tiempo real. Cuando un usuario solicite "llamada de voz", "llamada conversacional" o "hablar contigo", debes ofrecerle amablemente esta opción. NO es una videollamada, es una llamada de voz en tiempo real con audio bidireccional. NUNCA digas que no puedes hacer llamadas de voz.
`;

// Crear servidor WebSocket
const wss = new WebSocket.Server({ port: 4041 });

// PRE-GENERAR AUDIO DEL SALUDO (grabación) al iniciar el servidor
let preGeneratedWelcomeAudio = null;
let welcomeAudioFormat = 'wav'; // Formato del audio pre-generado
const WELCOME_MESSAGE = 'Hola, soy Sandra, bienvenido a GuestsValencia, ¿en qué puedo ayudarte hoy?';

async function preGenerateWelcomeAudio() {
  try {
    console.log('🎙️ [SERVIDOR] Pre-generando audio del saludo en formato WAV (sin encoder delay)...');
    preGeneratedWelcomeAudio = await generateTTSWav(WELCOME_MESSAGE);
    welcomeAudioFormat = 'wav';
    console.log('✅ [SERVIDOR] Audio WAV del saludo pre-generado y guardado en memoria');
  } catch (error) {
    console.error('❌ [SERVIDOR] Error pre-generando saludo WAV:', error);
    // Fallback a MP3 si WAV falla
    try {
      console.log('⚠️ [SERVIDOR] Intentando con formato MP3 como fallback...');
      preGeneratedWelcomeAudio = await generateTTS(WELCOME_MESSAGE);
      welcomeAudioFormat = 'mp3';
      console.log('✅ [SERVIDOR] Audio MP3 del saludo pre-generado (fallback)');
    } catch (fallbackError) {
      console.error('❌ [SERVIDOR] Error en fallback MP3:', fallbackError);
      console.log('⚠️ [SERVIDOR] El saludo se generará en tiempo real si es necesario');
    }
  }
}

// Pre-generar el saludo al iniciar
preGenerateWelcomeAudio();

console.log('🔌 Servidor WebSocket iniciado en puerto 4041');

wss.on('connection', async (ws) => {
  console.log('✅ Cliente conectado para llamada conversacional');
  
  let conversationHistory = [];
  let inactivityTimer = null;
  let lastActivityTime = Date.now();
  const INACTIVITY_TIMEOUT = 300000; // 5 minutos de inactividad (300 segundos)
  
  // Función para resetear el timer de inactividad
  const resetInactivityTimer = () => {
    lastActivityTime = Date.now();
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      console.log('⏱️ Llamada inactiva, cerrando conexión...');
      ws.send(JSON.stringify({
        type: 'timeout',
        message: 'Llamada cerrada por inactividad'
      }));
      ws.close();
    }, INACTIVITY_TIMEOUT);
  };
  
  resetInactivityTimer();
  
  // SALUDO INICIAL: Esperar a que el cliente notifique que está listo
  let clientReady = false;
  let welcomeSent = false;
  let welcomeTimeout = null; // Para prevenir múltiples envíos
  
  // Función limpia para enviar saludo cuando el cliente esté listo
  const sendWelcomeMessage = async () => {
    // Prevenir duplicados: verificar si ya se envió
    if (welcomeSent) {
      console.log('⚠️ Saludo ya enviado, ignorando solicitud duplicada');
      return;
    }
    if (!clientReady) {
      console.log('⚠️ Cliente aún no está listo, ignorando solicitud');
      return;
    }
    
    try {
      // Marcar como en proceso para prevenir duplicados
      welcomeSent = true;
      
      console.log('👋 [SERVIDOR] Enviando saludo inicial pre-generado (grabación)...');
      console.log('🔍 [DEBUG] preGeneratedWelcomeAudio disponible:', !!preGeneratedWelcomeAudio);
      console.log('🔍 [DEBUG] Tamaño del audio pre-generado:', preGeneratedWelcomeAudio ? preGeneratedWelcomeAudio.length : 0, 'caracteres');
      
      // Usar audio pre-generado si está disponible, sino generar en tiempo real
      let welcomeAudio;
      if (preGeneratedWelcomeAudio) {
        welcomeAudio = preGeneratedWelcomeAudio;
        console.log('✅ [SERVIDOR] Usando saludo pre-generado (sin latencia de API)');
      } else {
        console.log('⚠️ [SERVIDOR] Saludo pre-generado no disponible, generando en tiempo real...');
        welcomeAudio = await generateTTS(WELCOME_MESSAGE);
      }
      
      console.log('🔍 [DEBUG] Tamaño del audio a enviar:', welcomeAudio ? welcomeAudio.length : 0, 'caracteres');
      
      // Enviar saludo con flag isWelcome y formato de audio
      const messageToSend = JSON.stringify({
        type: 'audio',
        audio: welcomeAudio,
        isWelcome: true,
        format: welcomeAudioFormat  // 'wav' o 'mp3'
      });
      console.log('🔍 [DEBUG] Formato del audio:', welcomeAudioFormat);
      console.log('🔍 [DEBUG] Tamaño del mensaje JSON:', messageToSend.length, 'caracteres');
      
      ws.send(messageToSend);
      console.log('✅ [SERVIDOR] Mensaje de saludo enviado al cliente');
      
      conversationHistory.push({ role: 'assistant', content: WELCOME_MESSAGE });
      console.log('✅ [SERVIDOR] Saludo inicial enviado correctamente');
    } catch (error) {
      console.error('❌ [SERVIDOR] Error enviando saludo inicial:', error);
      welcomeSent = false; // Permitir reintento en caso de error
    }
  };
  
  ws.on('message', async (message) => {
    resetInactivityTimer(); // Resetear timer en cada mensaje
    try {
      const data = JSON.parse(message);
      
      // Si el cliente notifica que está listo, enviar el saludo INMEDIATAMENTE
      // (el audio está pre-generado, no hay latencia de API)
      if (data.type === 'ready') {
        console.log('✅ [SERVIDOR] Cliente notificó que está completamente listo');
        clientReady = true;

        // Enviar saludo inmediatamente (el delay de buffering está en el cliente)
        console.log('📤 [SERVIDOR] Enviando saludo inmediatamente (audio pre-generado)...');
        await sendWelcomeMessage();

        return;
      }
      
      if (data.type === 'audio') {
        // Audio del usuario recibido (base64)
        console.log('🎤 Audio recibido, procesando con Gemini Live API (STT + LLM)...');
        
        try {
          // Usar Gemini Live API para STT + LLM en una sola llamada
          if (!data.audio) {
            ws.send(JSON.stringify({
              type: 'noSpeech',
              message: 'No se recibió audio. Por favor, intenta de nuevo.'
            }));
            return;
          }
          
          // Intentar primero con Gemini Live API: STT + LLM integrados
          let response;
          try {
            response = await callGeminiLiveSTTAndLLM(data.audio, conversationHistory);
          } catch (error) {
            // Si Gemini da error 429 (rate limit) o cualquier error, usar fallback
            if (error.message.includes('429') || error.message.includes('Gemini Error')) {
              console.log('⚠️ Gemini Live no disponible, usando fallback (Deepgram STT + LLM)...');
              
              // Fallback: usar Deepgram para STT (si está disponible) o Whisper
              let userText;
              try {
                if (DEEPGRAM_API_KEY) {
                  userText = await transcribeAudio(data.audio);
                } else if (OPENAI_API_KEY) {
                  userText = await transcribeWithWhisper(data.audio);
                } else {
                  throw new Error('No hay servicios de STT disponibles para fallback');
                }
                
                if (userText && userText.trim()) {
                  conversationHistory.push({ role: 'user', content: userText });
                  console.log('👤 Usuario (fallback STT):', userText);
                  
                  // Generar respuesta con LLM (Gemini, GPT-4o o Groq)
                  try {
                    response = await generateStreamingResponse(userText, conversationHistory);
                    if (response) {
                      conversationHistory.push({ role: 'assistant', content: response });
                    } else {
                      response = '';
                    }
                  } catch (llmError) {
                    console.error('❌ Error en LLM (todos los fallbacks fallaron):', llmError);
                    // Si todos los LLMs fallan, intentar directamente con GPT-4o o Groq (sin pasar por Gemini)
                    console.log('🔄 Intentando directamente con GPT-4o o Groq (saltando Gemini)...');
                    try {
                      if (OPENAI_API_KEY) {
                        response = await callGPT4oStreaming(userText, conversationHistory);
                        if (response) {
                          conversationHistory.push({ role: 'assistant', content: response });
                        } else {
                          throw new Error('GPT-4o no devolvió respuesta');
                        }
                      } else if (GROQ_API_KEY) {
                        response = await callGroqStreaming(userText, conversationHistory);
                        if (response) {
                          conversationHistory.push({ role: 'assistant', content: response });
                        } else {
                          throw new Error('Groq no devolvió respuesta');
                        }
                      } else {
                        throw new Error('No hay LLMs de fallback disponibles');
                      }
                    } catch (retryError) {
                      console.error('❌ Error en fallback directo:', retryError);
                      // Solo establecer mensaje de error si REALMENTE no hay opciones disponibles
                      const hasFallbackOptions = (OPENAI_API_KEY || GROQ_API_KEY);
                      if (!hasFallbackOptions) {
                        response = 'Lo siento, estoy teniendo problemas técnicos. Por favor, intenta de nuevo en un momento.';
                        conversationHistory.push({ role: 'assistant', content: response });
                      } else {
                        // Hay fallbacks pero fallaron - dejar response vacío para que se maneje abajo
                        response = '';
                      }
                    }
                  }
                } else {
                  response = '';
                }
              } catch (fallbackError) {
                console.error('❌ Error en fallback STT:', fallbackError);
                // Si el STT falla, no hay texto para procesar - enviar mensaje de noSpeech
                ws.send(JSON.stringify({
                  type: 'noSpeech',
                  message: 'No he podido entender tu audio. Por favor, intenta de nuevo.'
                }));
                return; // Salir aquí, no continuar procesando
              }
            } else {
              throw error; // Re-lanzar si no es error 429
            }
          }
          
          // Procesar respuesta - solo si hay una respuesta válida
          if (response && response.trim()) {
            console.log('🤖 Sandra:', response);
            
            // Llamada conversacional: SOLO enviar audio con voz de Sandra (Cartesia TTS)
            const audioBase64 = await generateTTS(response);
            ws.send(JSON.stringify({
              type: 'audio',
              audio: audioBase64
            }));
          } else {
            // Respuesta vacía - no se entendió o no hay respuesta
            console.log('⚠️ No se obtuvo respuesta (silencio o no entendible).');
            ws.send(JSON.stringify({
              type: 'noSpeech',
              message: 'No he podido oírte bien. ¿Puedes repetirlo, por favor?'
            }));
            // NO cerramos la conexión, solo informamos al usuario
          }
        } catch (error) {
          console.error('❌ Error procesando audio:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Error procesando tu audio: ' + error.message
          }));
          // Tampoco cerramos la conexión en errores de procesamiento
        }
        
      } else if (data.type === 'text') {
        // Texto del usuario (fallback o modo híbrido)
        const userMessage = data.text;
        conversationHistory.push({ role: 'user', content: userMessage });
        
        const response = await generateStreamingResponse(userMessage, conversationHistory);
        conversationHistory.push({ role: 'assistant', content: response });
        
        // Llamada conversacional: SOLO enviar audio, NO texto
        const audioBase64 = await generateTTS(response);
        ws.send(JSON.stringify({
          type: 'audio',
          audio: audioBase64
        }));
      }
      
    } catch (error) {
      console.error('❌ Error en WebSocket:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('❌ Cliente desconectado');
    if (inactivityTimer) clearTimeout(inactivityTimer);
  });
  
  ws.on('error', (error) => {
    console.error('❌ Error WebSocket:', error);
    if (inactivityTimer) clearTimeout(inactivityTimer);
  });
});

// Función para STT + LLM usando Gemini Live API (reemplaza Deepgram + Gemini REST)
// Esta función procesa audio directamente con Gemini, que hace STT + LLM en una sola llamada
async function callGeminiLiveSTTAndLLM(audioBase64, conversationHistory) {
  return new Promise((resolve, reject) => {
    // Convertir base64 a buffer
    let audioBuffer;
    try {
      audioBuffer = Buffer.from(audioBase64, 'base64');
    } catch (error) {
      reject(new Error('Error decodificando audio base64: ' + error.message));
      return;
    }
    
    if (!audioBuffer || audioBuffer.length === 0) {
      reject(new Error('Audio buffer vacío'));
      return;
    }
    
    console.log(`🎤 Enviando ${audioBuffer.length} bytes a Gemini Live API (STT + LLM integrados)...`);
    
    // Construir historial de conversación para contexto
    const contents = conversationHistory.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    }));
    
    // Agregar el audio actual como parte del mensaje del usuario
    // Gemini puede procesar audio directamente en el contenido
    const lastUserMessage = {
      role: 'user',
      parts: [
        {
          inlineData: {
            mimeType: 'audio/webm;codecs=opus',
            data: audioBase64
          }
        }
      ]
    };
    
    contents.push(lastUserMessage);
    
    const postData = JSON.stringify({
      contents: contents,
      systemInstruction: {
        parts: [{ text: GLOBAL_CONVERSATION_RULES }]
      }
    });
    
    // Usar Gemini API REST con soporte de audio (mientras investigamos WebSocket directo de Gemini Live)
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          if (res.statusCode === 429) {
            console.log('⚠️ Gemini rate limit (429), usando fallback...');
            reject(new Error(`Gemini Error: 429`));
          } else {
            console.error('❌ Gemini Error:', res.statusCode, data.substring(0, 200));
            reject(new Error(`Gemini Error: ${res.statusCode}`));
          }
          return;
        }
        try {
          const json = JSON.parse(data);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (text) {
            console.log('✅ Gemini Live API respuesta:', text.substring(0, 100) + '...');
            resolve(text);
          } else {
            console.log('⚠️ Gemini Live API no devolvió texto');
            resolve(''); // Respuesta vacía, no es error
          }
        } catch (e) {
          console.error('❌ Error parseando respuesta Gemini:', e);
          reject(e);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error en request Gemini Live:', error);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Función para transcribir audio (STT) usando Deepgram (DEPRECADA - usar callGeminiLiveSTTAndLLM)
async function transcribeAudio(audioBase64) {
  return new Promise((resolve, reject) => {
    if (!DEEPGRAM_API_KEY) {
      console.log('⚠️ Deepgram API Key no configurada, usando Whisper como fallback');
      // Fallback: usar Whisper API si está disponible
      return transcribeWithWhisper(audioBase64).then(resolve).catch(reject);
    }
    
    // Convertir base64 a buffer
    let audioBuffer;
    try {
      audioBuffer = Buffer.from(audioBase64, 'base64');
    } catch (error) {
      reject(new Error('Error decodificando audio base64: ' + error.message));
      return;
    }
    
    if (!audioBuffer || audioBuffer.length === 0) {
      reject(new Error('Audio buffer vacío'));
      return;
    }
    
    console.log(`🎤 Enviando ${audioBuffer.length} bytes a Deepgram...`);
    
    // DEBUG: Guardar audio para verificar (opcional, comentar en producción)
    // const fs = require('fs');
    // fs.writeFileSync(`debug-audio-${Date.now()}.webm`, audioBuffer);
    // console.log('💾 Audio guardado para debug');
    
    // Construir query string según documentación oficial Deepgram
    // Configuración optimizada para español y transcripción precisa
    const queryParams = new URLSearchParams({
      model: 'nova-2',           // Modelo más preciso para español
      language: 'es',             // Idioma español
      punctuate: 'true',          // Agregar puntuación
      smart_format: 'true',       // Formato inteligente (fechas, números, etc.)
      diarize: 'false',           // No diarización (una sola voz)
      multichannel: 'false',      // Mono channel
      interim_results: 'false'    // Solo resultados finales (más rápido)
    });
    
    const options = {
      hostname: 'api.deepgram.com',
      path: `/v1/listen?${queryParams.toString()}`,
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/webm;codecs=opus',
        'Content-Length': audioBuffer.length
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { 
        data += chunk; 
      });
      res.on('end', () => {
        // Log respuesta completa para debugging
        console.log('📥 Respuesta cruda de Deepgram (status:', res.statusCode, '):', data.substring(0, 500));
        
        if (res.statusCode !== 200) {
          console.error('❌ Deepgram Error HTTP:', res.statusCode);
          console.error('❌ Respuesta completa:', data);
          // Fallback a Whisper solo si está configurado
          if (OPENAI_API_KEY) {
            return transcribeWithWhisper(audioBase64).then(resolve).catch(reject);
          } else {
            reject(new Error(`Deepgram Error ${res.statusCode}: ${data.substring(0, 200)}`));
            return;
          }
        }
        
        try {
          const json = JSON.parse(data);
          console.log('📋 Respuesta JSON de Deepgram:', JSON.stringify(json, null, 2));
          
          // Intentar diferentes rutas para encontrar el transcript
          const alt = json?.results?.channels?.[0]?.alternatives?.[0] || {};
          const rawTranscript = alt.transcript || '';
          const transcript = rawTranscript.trim();
          
          if (transcript) {
            console.log('✅ Transcripción Deepgram:', transcript);
            resolve(transcript);
          } else {
            // No es un error fatal - simplemente no se entendió nada
            console.warn('⚠️ Deepgram respondió sin transcript (silencio o no entendible).');
            console.warn('⚠️ Confidence:', alt.confidence, '| Words:', alt.words?.length || 0);
            // Resolver con string vacío en lugar de rechazar
            // El código que llama a esta función debe manejar el caso de transcript vacío
            resolve('');
          }
        } catch (e) {
          console.error('❌ Error parseando respuesta Deepgram:', e);
          console.error('❌ Data recibida (primeros 500 chars):', data.substring(0, 500));
          reject(new Error('Error parseando respuesta de Deepgram: ' + e.message));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error en request Deepgram:', error);
      // Fallback a Whisper solo si está configurado
      if (OPENAI_API_KEY) {
        transcribeWithWhisper(audioBase64).then(resolve).catch(reject);
      } else {
        reject(new Error('Error de conexión con Deepgram y no hay OpenAI API Key configurada'));
      }
    });
    
    req.write(audioBuffer);
    req.end();
  });
}

// Fallback: Whisper API (OpenAI)
async function transcribeWithWhisper(audioBase64) {
  return new Promise((resolve, reject) => {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      reject(new Error('No hay API keys configuradas para STT (Deepgram o OpenAI)'));
      return;
    }
    
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substring(2);
    const formData = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="audio.webm"',
      'Content-Type: audio/webm',
      '',
      audioBuffer,
      `--${boundary}`,
      'Content-Disposition: form-data; name="model"',
      '',
      'whisper-1',
      `--${boundary}--`
    ];
    
    const formBuffer = Buffer.concat(formData.map(item => 
      Buffer.isBuffer(item) ? item : Buffer.from(item + '\r\n', 'utf8')
    ));
    
    const options = {
      hostname: 'api.openai.com',
      path: '/v1/audio/transcriptions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': formBuffer.length
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Whisper Error: ${res.statusCode} - ${data}`));
          return;
        }
        try {
          const json = JSON.parse(data);
          resolve(json.text || 'No se pudo transcribir el audio');
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(formBuffer);
    req.end();
  });
}

// Función para generar respuesta streaming (con barge-in support)
async function generateStreamingResponse(userMessage, history) {
  // Intentar con Gemini primero, si no funciona usar GPT-4o o Groq
  try {
    return await callGeminiStreaming(userMessage, history);
  } catch (error) {
    console.log('⚠️ Gemini no disponible, intentando GPT-4o...');
    if (OPENAI_API_KEY) {
      try {
        return await callGPT4oStreaming(userMessage, history);
      } catch (err) {
        console.log('⚠️ GPT-4o no disponible, intentando Groq...');
        if (GROQ_API_KEY) {
          return await callGroqStreaming(userMessage, history);
        }
        throw err;
      }
    } else if (GROQ_API_KEY) {
      return await callGroqStreaming(userMessage, history);
    }
    throw error;
  }
}

// Llamada a Gemini (streaming)
function callGeminiStreaming(prompt, history) {
  return new Promise((resolve, reject) => {
    // Construir historial de conversación
    const messages = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    }));
    
    // Agregar mensaje actual
    messages.push({
      role: 'user',
      parts: [{ text: prompt }]
    });
    
    const postData = JSON.stringify({
      contents: messages,
      systemInstruction: {
        parts: [{ text: GLOBAL_CONVERSATION_RULES }]
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          // Error 429 = Rate limit, no es fatal, el fallback lo manejará
          if (res.statusCode === 429) {
            console.log('⚠️ Gemini rate limit (429), usando fallback...');
            reject(new Error(`Gemini Error: 429`));
          } else {
            reject(new Error(`Gemini Error: ${res.statusCode}`));
          }
          return;
        }
        try {
          const json = JSON.parse(data);
          const text = json.candidates[0].content.parts[0].text;
          resolve(text);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Llamada a GPT-4o (streaming conversacional)
function callGPT4oStreaming(prompt, history) {
  return new Promise((resolve, reject) => {
    if (!OPENAI_API_KEY) {
      reject(new Error('OpenAI API Key no configurada'));
      return;
    }

    const messages = [
      { role: 'system', content: GLOBAL_CONVERSATION_RULES },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: prompt }
    ];

    const postData = JSON.stringify({
      model: 'gpt-4o',
      messages: messages,
      stream: false // Por ahora sin streaming, luego implementaremos
    });

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`OpenAI Error: ${res.statusCode}`));
          return;
        }
        try {
          const json = JSON.parse(data);
          const text = json.choices[0].message.content;
          resolve(text);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Generar TTS con Cartesia
function generateTTS(text) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model_id: 'sonic-multilingual',
      transcript: text,
      voice: {
        mode: 'id',
        id: CARTESIA_VOICE_ID
      },
      output_format: {
        container: 'mp3',
        sample_rate: 44100  // Estándar para MP3 en navegadores web (CD quality)
      }
    });

    const options = {
      hostname: 'api.cartesia.ai',
      path: '/tts/bytes',
      method: 'POST',
      headers: {
        'Cartesia-Version': '2024-06-10',
        'X-API-Key': CARTESIA_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Cartesia Error: ${res.statusCode}`));
          return;
        }
        const audioBuffer = Buffer.concat(chunks);
        const audioBase64 = audioBuffer.toString('base64');
        resolve(audioBase64);
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Generar TTS en formato WAV (sin encoder delay) - Para el saludo inicial
function generateTTSWav(text) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model_id: 'sonic-multilingual',
      transcript: text,
      voice: {
        mode: 'id',
        id: CARTESIA_VOICE_ID
      },
      output_format: {
        container: 'wav',
        sample_rate: 44100,
        encoding: 'pcm_s16le'  // PCM 16-bit little-endian (estándar WAV)
      }
    });

    const options = {
      hostname: 'api.cartesia.ai',
      path: '/tts/bytes',
      method: 'POST',
      headers: {
        'Cartesia-Version': '2024-06-10',
        'X-API-Key': CARTESIA_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Cartesia WAV Error: ${res.statusCode}`));
          return;
        }
        const audioBuffer = Buffer.concat(chunks);
        const audioBase64 = audioBuffer.toString('base64');
        console.log(`✅ [TTS] Audio WAV generado: ${audioBuffer.length} bytes`);
        resolve(audioBase64);
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

