/**
 * OpenAI Chat API - Conversation by Text Only
 * FASE 2: Conversational AI using gpt-4o-mini (text only)
 *
 * Flow:
 * 1. Browser captures audio → sends to Deepgram API (via this endpoint)
 * 2. Deepgram converts audio to text
 * 3. Send text to gpt-4o-mini
 * 4. Receive text response
 * 5. Pass to native voice system (Sandra)
 */

const { Deepgram } = require('@deepgram/sdk');

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
    const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

    if (!OPENAI_API_KEY) {
      console.error('[CHAT-TEXT] OPENAI_API_KEY no configurada');
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Extraer parámetros del request
    let { userText, audioData, language = 'es', conversationHistory = [] } = req.body;

    // OPCIÓN 1: Si viene audioData, procesar con Deepgram
    if (audioData && !userText) {
      if (!DEEPGRAM_API_KEY) {
        console.error('[CHAT-TEXT] DEEPGRAM_API_KEY no configurada');
        return res.status(500).json({ error: 'Deepgram API key not configured' });
      }

      console.log('[CHAT-TEXT] Procesando audio con Deepgram...');

      try {
        // Convertir base64 a Buffer si es necesario
        const audioBuffer = Buffer.from(audioData, 'base64');

        const deepgram = new Deepgram({ apiKey: DEEPGRAM_API_KEY });

        const response = await deepgram.listen.prerecorded.transcribeBuffer(
          audioBuffer,
          {
            model: 'nova-2',
            language: language === 'es' ? 'es' : language === 'en' ? 'en' : 'es',
            smart_format: true
          }
        );

        // Extraer texto transcrito
        const transcript = response.result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;

        if (!transcript) {
          console.error('[CHAT-TEXT] Deepgram no devolvió transcripción');
          return res.status(500).json({ error: 'Deepgram transcription failed' });
        }

        userText = transcript;
        console.log('[CHAT-TEXT] Deepgram transcripción:', userText);

      } catch (deepgramError) {
        console.error('[CHAT-TEXT] Error Deepgram:', deepgramError.message);
        return res.status(500).json({ error: 'Deepgram transcription failed', details: deepgramError.message });
      }
    }

    // OPCIÓN 2: Si viene userText, usarlo directamente
    if (!userText) {
      return res.status(400).json({ error: 'userText or audioData is required' });
    }

    console.log('[CHAT-TEXT] Usuario texto:', userText);
    console.log('[CHAT-TEXT] Idioma:', language);

    // Obtener instrucciones del sistema
    const systemInstructions = await getSandraInstructions(language);

    // Preparar mensajes para la API de Chat
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: userText
      }
    ];

    console.log('[CHAT-TEXT] Enviando a gpt-4o-mini...');

    // Llamar a OpenAI Chat API (NO Realtime)
    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemInstructions
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error('[CHAT-TEXT] Error OpenAI:', chatResponse.status, errorText);
      return res.status(chatResponse.status).json({
        error: 'Failed to get response from OpenAI',
        details: errorText
      });
    }

    const chatData = await chatResponse.json();
    const assistantMessage = chatData.choices[0]?.message?.content;

    if (!assistantMessage) {
      console.error('[CHAT-TEXT] No response content received');
      return res.status(500).json({ error: 'No response content received' });
    }

    console.log('[CHAT-TEXT] Respuesta Sandra:', assistantMessage);

    // Retornar respuesta
    return res.status(200).json({
      success: true,
      userText: userText,
      assistantMessage: assistantMessage,
      // Información para detectar tipo de respuesta en el frontend
      responseType: detectResponseType(assistantMessage, language),
      // Para mantener historial conversacional
      usage: {
        prompt_tokens: chatData.usage?.prompt_tokens,
        completion_tokens: chatData.usage?.completion_tokens,
        total_tokens: chatData.usage?.total_tokens
      }
    });

  } catch (error) {
    console.error('[CHAT-TEXT] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};

/**
 * Obtener instrucciones del sistema (multilingüe)
 */
async function getSandraInstructions(language = 'es') {
  try {
    const systemPromptModule = require('../../lib/systemPrompt.js');
    if (systemPromptModule && systemPromptModule.getSystemPrompt) {
      return systemPromptModule.getSystemPrompt();
    }
  } catch (e) {
    console.warn('[CHAT-TEXT] No se pudo cargar systemPrompt.js:', e.message);
  }

  // Prompts multilingües según idioma
  const prompts = {
    'es': `Eres Sandra, la conserje virtual de GuestsValencia. Eres amable, profesional y siempre disponible para ayudar a los huéspedes con sus necesidades de alojamiento en Valencia.

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

Responde siempre en español neutro, con buena ortografía y gramática. Sé breve y directa, máximo 4 frases salvo que se pida detalle.`,

    'en': `You are Sandra, the virtual concierge of GuestsValencia. You are friendly, professional and always available to help guests with their accommodation needs in Valencia.

Your personality:
- Friendly and welcoming
- Professional and efficient
- Knowledgeable about Valencia and its accommodations
- Always willing to help

Your role:
- Help guests find accommodations
- Answer questions about properties
- Manage reservations
- Provide local recommendations

Always respond in neutral English, with good spelling and grammar. Be brief and direct, maximum 4 sentences unless detail is requested.`,

    'fr': `Tu es Sandra, la concierge virtuelle de GuestsValencia. Tu es amicale, professionnelle et toujours disponible pour aider les invités avec leurs besoins d'hébergement à Valence.

Ta personnalité:
- Amicale et accueillante
- Professionnelle et efficace
- Connaisseuse de Valence et de ses hébergements
- Toujours prête à aider

Ton rôle:
- Aider les invités à trouver des hébergements
- Répondre aux questions sur les propriétés
- Gérer les réservations
- Fournir des recommandations locales

Réponds toujours en français neutre, avec une bonne orthographe et grammaire. Sois brève et directe, maximum 4 phrases sauf si des détails sont demandés.`
  };

  return prompts[language] || prompts['es'];
}

/**
 * Detectar tipo de respuesta para seleccionar voz adecuada
 */
function detectResponseType(text, language = 'es') {
  const lowerText = text.toLowerCase();

  // Palabras clave por idioma
  if (language === 'es' || language === 'es-ES') {
    if (lowerText.includes('bienvenid')) return 'welcome';
    if (lowerText.includes('lujo') || lowerText.includes('premium')) return 'luxury';
    if (lowerText.includes('error') || lowerText.includes('problema')) return 'error';
    if (lowerText.includes('ayuda') || lowerText.includes('soporte')) return 'support';
    return 'general';
  }

  if (language === 'en' || language === 'en-US') {
    if (lowerText.includes('welcome')) return 'welcome';
    if (lowerText.includes('luxury') || lowerText.includes('premium')) return 'luxury';
    if (lowerText.includes('error') || lowerText.includes('problem')) return 'error';
    if (lowerText.includes('help') || lowerText.includes('support')) return 'support';
    return 'general';
  }

  return 'general';
}
