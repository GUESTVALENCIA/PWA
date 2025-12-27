/**
 * OpenAI Realtime API - Token Efímero
 * Genera un token de sesión para conexión WebRTC directa
 * Mantiene la API key segura en el servidor
 */

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      console.error('[Realtime] OPENAI_API_KEY no configurada');
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Crear sesión de Realtime con configuración de Sandra
    // OpenAI Realtime API: crear sesión y obtener token efímero
    const sessionResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1'
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy', // Voz de Sandra
        instructions: await getSandraInstructions(),
        temperature: 0.8,
        max_response_output_tokens: 4096,
        modalities: ['audio', 'text'], // Audio primero para priorizar
        // Configurar transcripción de audio de entrada (requerido para WebRTC)
        input_audio_transcription: {
          model: 'whisper-1'
        },
        // Nota: input_audio_format y output_audio_format no se usan con WebRTC
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        },
        tools: [
          {
            type: 'function',
            name: 'checkAvailability',
            description: 'Verificar disponibilidad de alojamientos',
            parameters: {
              type: 'object',
              properties: {
                destination: { type: 'string' },
                checkIn: { type: 'string' },
                checkOut: { type: 'string' },
                guests: { type: 'number' }
              },
              required: ['destination', 'checkIn', 'checkOut', 'guests']
            }
          },
          {
            type: 'function',
            name: 'bookAccommodation',
            description: 'Reservar un alojamiento',
            parameters: {
              type: 'object',
              properties: {
                propertyId: { type: 'string' },
                checkIn: { type: 'string' },
                checkOut: { type: 'string' },
                guests: { type: 'number' }
              },
              required: ['propertyId', 'checkIn', 'checkOut', 'guests']
            }
          }
        ],
        tool_choice: 'auto'
      })
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('[Realtime] Error creando sesión:', sessionResponse.status, errorText);
      return res.status(sessionResponse.status).json({ 
        error: 'Failed to create Realtime session',
        details: errorText 
      });
    }

    const sessionData = await sessionResponse.json();
    
    const sessionId = sessionData.session_id || sessionData.id || null;
    // El token efímero para WebRTC está en client_secret.value
    const ephemeralToken = sessionData.client_secret?.value;

    if (!ephemeralToken) {
      console.error('[Realtime] No se recibió token efímero');
      return res.status(500).json({ error: 'No ephemeral token received' });
    }

    console.log('[Realtime] Sesión creada:', sessionId);

    return res.status(200).json({
      session_id: sessionId,
      token: ephemeralToken,
      expires_at: sessionData.expires_at || sessionData.client_secret?.expires_at || null
    });

  } catch (error) {
    console.error('[Realtime] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

/**
 * Obtener instrucciones del sistema prompt de Sandra
 */
async function getSandraInstructions() {
  try {
    // Intentar cargar desde el archivo systemPrompt.js (CommonJS)
    const systemPromptModule = require('../../lib/systemPrompt.js');
    if (systemPromptModule && systemPromptModule.getSystemPrompt) {
      return systemPromptModule.getSystemPrompt();
    }
  } catch (e) {
    console.warn('[Realtime] No se pudo cargar systemPrompt.js, usando fallback:', e.message);
  }

  // Fallback: prompt básico de Sandra
  return `Eres Sandra, la conserje virtual de GuestsValencia. Eres amable, profesional y siempre disponible para ayudar a los huéspedes con sus necesidades de alojamiento en Valencia.

Tu personalidad:
- Amable y acogedora
- Profesional y eficiente
- Conocedora de Valencia y sus alojamientos
- Siempre dispuesta a ayudar

Tu rol:
- Ayudar a los huéspedes a encontrar alojamientos
- Responder preguntas sobre propiedades
- Gestionar reservas
- Proporcionar recomendaciones locales

Responde siempre en español neutro, con buena ortografía y gramática. Sé breve y directa, máximo 4 frases salvo que se pida detalle.`;
}

