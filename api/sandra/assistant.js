// API Endpoint: /api/sandra/assistant
// Sistema conversacional avanzado con function calling (Sandra-Live)
// Adaptado del sistema original pero integrado con la arquitectura existente

// Importar prompt y herramientas (nota: en serverless, necesitamos cargar desde módulos)
// Para Vercel, usamos require si está disponible o cargamos inline

/**
 * Obtener prompt del sistema (inline para serverless)
 */
function getSystemPrompt() {
  return `
Eres "Sandra", una asistente virtual conversacional experta en hospitalidad y turismo para GuestsValencia.

Tu objetivo es ayudar a los clientes a encontrar y reservar el alojamiento perfecto en Valencia de forma amable y eficiente.

## Funciones Disponibles:
Dispones de herramientas para verificar disponibilidad, reservar, resaltar propiedades, etc. Úsalas de forma natural sin explicar que invocas funciones.

Herramientas disponibles:
- checkAvailability(propertyId, checkIn, checkOut): Verifica disponibilidad
- bookAccommodation(propertyId, checkIn, checkOut, guests): Inicia reserva
- highlightProperty(propertyId): Resalta propiedad en interfaz
- showPropertyDetails(propertyId): Muestra detalles
- addToWishlist(propertyId): Añade a favoritos
- getRecommendations(criteria): Obtiene recomendaciones

Responde en español neutro, sé breve (máximo 4-5 frases), y proporciona excelente servicio al cliente.
`;
}

/**
 * Definiciones de herramientas para OpenAI Function Calling
 */
function getToolDefinitions() {
  return [
    {
      name: 'checkAvailability',
      description: 'Verifica la disponibilidad de una propiedad en fechas específicas.',
      parameters: {
        type: 'object',
        properties: {
          propertyId: { type: 'string', description: 'ID de la propiedad' },
          checkIn: { type: 'string', description: 'Fecha check-in (YYYY-MM-DD)' },
          checkOut: { type: 'string', description: 'Fecha check-out (YYYY-MM-DD)' }
        },
        required: ['propertyId', 'checkIn', 'checkOut']
      }
    },
    {
      name: 'bookAccommodation',
      description: 'Inicia el proceso de reserva de una propiedad.',
      parameters: {
        type: 'object',
        properties: {
          propertyId: { type: 'string', description: 'ID de la propiedad' },
          checkIn: { type: 'string', description: 'Fecha check-in (YYYY-MM-DD)' },
          checkOut: { type: 'string', description: 'Fecha check-out (YYYY-MM-DD)' },
          guests: { type: 'integer', description: 'Número de huéspedes', default: 2 }
        },
        required: ['propertyId', 'checkIn', 'checkOut']
      }
    },
    {
      name: 'highlightProperty',
      description: 'Resalta una propiedad en la interfaz para que el cliente la vea.',
      parameters: {
        type: 'object',
        properties: {
          propertyId: { type: 'string', description: 'ID de la propiedad' }
        },
        required: ['propertyId']
      }
    },
    {
      name: 'showPropertyDetails',
      description: 'Muestra los detalles completos de una propiedad.',
      parameters: {
        type: 'object',
        properties: {
          propertyId: { type: 'string', description: 'ID de la propiedad' }
        },
        required: ['propertyId']
      }
    },
    {
      name: 'addToWishlist',
      description: 'Añade una propiedad a la lista de favoritos.',
      parameters: {
        type: 'object',
        properties: {
          propertyId: { type: 'string', description: 'ID de la propiedad' }
        },
        required: ['propertyId']
      }
    },
    {
      name: 'getRecommendations',
      description: 'Obtiene recomendaciones de propiedades basadas en criterios.',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'Ubicación preferida' },
          checkIn: { type: 'string', description: 'Fecha check-in (YYYY-MM-DD)' },
          checkOut: { type: 'string', description: 'Fecha check-out (YYYY-MM-DD)' },
          guests: { type: 'integer', description: 'Número de huéspedes' },
          budget: { type: 'number', description: 'Presupuesto máximo por noche' },
          amenities: { type: 'array', items: { type: 'string' }, description: 'Amenidades deseadas' }
        },
        required: []
      }
    }
  ];
}

/**
 * Herramientas disponibles en el servidor (simuladas, el cliente ejecuta las reales)
 */
const availableTools = {
  checkAvailability: (productId, checkIn, checkOut) => {
    return `Verificando disponibilidad para propiedad ${productId} del ${checkIn} al ${checkOut}...`;
  },
  highlightProduct: (productId) => {
    return `Resaltando propiedad ${productId} en la interfaz.`;
  },
  bookAccommodation: (propertyId, checkIn, checkOut, guests) => {
    return `Reserva iniciada para propiedad ${propertyId}, fechas: ${checkIn} - ${checkOut}, ${guests} huéspedes.`;
  }
};

/**
 * Handler principal del endpoint
 */
export default async function handler(req, res) {
  // CORS headers
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
    const { audio, messages, transcription } = req.body;

    // 1. Obtener transcripción (si viene audio, transcribir; si viene transcription, usarla)
    let finalTranscription = transcription || '';

    if (audio && !transcription) {
      // Transcribir audio con Deepgram
      if (!process.env.DEEPGRAM_API_KEY) {
        throw new Error('DEEPGRAM_API_KEY no configurada');
      }

      const audioBuffer = Buffer.from(audio, 'base64');
      const dgRes = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=es', {
        method: 'POST',
        headers: {
          'Content-Type': 'audio/webm',
          'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`
        },
        body: audioBuffer
      });

      const dgData = await dgRes.json();
      finalTranscription = dgData?.results?.channels[0]?.alternatives[0]?.transcript || '';
    }

    if (!finalTranscription.trim()) {
      return res.status(400).json({ error: 'No se pudo obtener transcripción' });
    }

    // 2. Preparar mensajes para la IA
    const systemPrompt = getSystemPrompt();
    const conversation = [
      { role: 'system', content: systemPrompt },
      // Incorporar historial de conversación
      ...(messages || []).map(msg => ({
        role: msg.sender === 'assistant' ? 'assistant' : 'user',
        content: msg.text
      })),
      // Añadir mensaje actual
      { role: 'user', content: finalTranscription }
    ];

    // 3. Definir funciones para OpenAI Function Calling
    const functionsDef = getToolDefinitions();

    // 4. Determinar endpoint y headers (OpenAI o OpenRouter)
    const useOpenRouter = !!process.env.OPENROUTER_API_KEY;
    const apiUrl = useOpenRouter
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';

    const headers = {
      'Content-Type': 'application/json'
    };

    if (useOpenRouter) {
      headers['Authorization'] = `Bearer ${process.env.OPENROUTER_API_KEY}`;
      if (process.env.OPENAI_API_KEY) {
        headers['X-OpenAI-Api-Key'] = process.env.OPENAI_API_KEY;
      }
    } else if (process.env.OPENAI_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.OPENAI_API_KEY}`;
    } else if (process.env.GEMINI_API_KEY) {
      // Fallback a Gemini si OpenAI no está disponible
      return await handleGeminiConversation(req, res, finalTranscription, messages, conversation);
    } else {
      throw new Error('No hay API key configurada (OpenAI, OpenRouter o Gemini)');
    }

    const model = process.env.OPENAI_MODEL_DEFAULT || 'gpt-4o';

    // 5. Llamar a OpenAI con function calling
    const aiRes = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: conversation,
        functions: functionsDef,
        function_call: 'auto'
      })
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text();
      throw new Error(`AI API Error: ${aiRes.status} - ${errorText}`);
    }

    const aiData = await aiRes.json();

    if (!aiData?.choices?.[0]?.message) {
      throw new Error('Respuesta inválida de la API de IA');
    }

    const choice = aiData.choices[0].message;
    let assistantReply = '';
    let actionName = null;
    let actionParams = null;

    // 6. Verificar si la IA quiere invocar una función
    if (choice.function_call) {
      actionName = choice.function_call.name;
      try {
        actionParams = choice.function_call.arguments
          ? JSON.parse(choice.function_call.arguments)
          : {};
      } catch (e) {
        actionParams = {};
      }

      // Ejecutar función en el servidor (simulada, el cliente ejecuta la real)
      let functionResult = '';
      if (actionName === 'checkAvailability' && actionParams.propertyId && actionParams.checkIn && actionParams.checkOut) {
        functionResult = availableTools.checkAvailability(
          actionParams.propertyId,
          actionParams.checkIn,
          actionParams.checkOut
        );
      } else if (actionName === 'bookAccommodation' && actionParams.propertyId && actionParams.checkIn && actionParams.checkOut) {
        functionResult = availableTools.bookAccommodation(
          actionParams.propertyId,
          actionParams.checkIn,
          actionParams.checkOut,
          actionParams.guests || 2
        );
      } else if (actionName === 'highlightProperty' && actionParams.propertyId) {
        functionResult = availableTools.highlightProduct(actionParams.propertyId);
      } else {
        functionResult = `Función ${actionName} ejecutada con parámetros: ${JSON.stringify(actionParams)}`;
      }

      // Añadir resultado de función al contexto y obtener respuesta final
      conversation.push({
        role: 'function',
        name: actionName,
        content: functionResult
      });

      // Segunda llamada para obtener respuesta final
      const aiRes2 = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: conversation
        })
      });

      if (!aiRes2.ok) {
        throw new Error(`AI API Error (2nd call): ${aiRes2.status}`);
      }

      const aiData2 = await aiRes2.json();
      assistantReply = aiData2.choices[0].message.content || 'Función ejecutada correctamente.';
    } else {
      // Respuesta directa sin funciones
      assistantReply = choice.content || 'Lo siento, no pude procesar tu solicitud.';
    }

    // 7. Generar audio TTS si está configurado (opcional)
    let audioResponse = null;
    if (process.env.CARTESIA_API_KEY && req.body.generateAudio !== false) {
      try {
        const ttsRes = await fetch('https://api.cartesia.ai/tts/bytes', {
          method: 'POST',
          headers: {
            'Cartesia-Version': '2024-06-10',
            'X-API-Key': process.env.CARTESIA_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model_id: 'sonic-multilingual',
            transcript: assistantReply,
            voice: {
              mode: 'id',
              id: process.env.CARTESIA_VOICE_ID || '2d5b0e6cf361460aa7fc47e3cee4b30c'
            }
          })
        });

        if (ttsRes.ok) {
          const audioBuffer = await ttsRes.arrayBuffer();
          audioResponse = Buffer.from(audioBuffer).toString('base64');
        }
      } catch (ttsError) {
        console.warn('Error generando TTS:', ttsError);
        // No fallar si TTS falla
      }
    }

    // 8. Retornar respuesta
    return res.status(200).json({
      transcription: finalTranscription,
      reply: assistantReply,
      action: actionName,
      params: actionParams,
      audio: audioResponse // Audio en base64 si está disponible
    });

  } catch (error) {
    console.error('❌ Error en /api/sandra/assistant:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

/**
 * Handler alternativo para Gemini (si OpenAI no está disponible)
 */
async function handleGeminiConversation(req, res, transcription, messages, conversation) {
  // Implementación simplificada para Gemini (sin function calling avanzado)
  // En producción, usaríamos la lógica existente de Gemini del api-gateway
  
  return res.status(501).json({
    error: 'Gemini con function calling no implementado aún',
    transcription,
    reply: 'Lo siento, esta funcionalidad está en desarrollo.'
  });
}

