/**
 * OpenAI Realtime API - Token Efímero
 * Genera un token de sesión para conexión WebRTC directa
 * Mantiene la API key segura en el servidor
 * 
 * INTEGRACIÓN COMPLETA DEL PIPELINE DE GEMINI API:
 * - Orquestación de Contexto (Clima, Hora, Eventos)
 * - Sistema de Prioridades (Eventos > Horario > Clima)
 * - Pipeline completo: STT → LLM → TTS → Video Sync
 * - Estados Cinematográficos
 * - Barge-in para interrupciones
 */

// Importar orquestador de contexto
let contextOrchestrator;
try {
  contextOrchestrator = require('../../lib/contextOrchestrator.js');
} catch (e) {
  console.warn('[Realtime] No se pudo cargar contextOrchestrator.js:', e.message);
}

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

    // Detectar idioma desde el request o usar español por defecto
    const requestedLanguage = req.body?.language || req.query?.language || 'es';
    
    // Mapeo de idiomas soportados (códigos ISO 639-1)
    const supportedLanguages = {
      'es': 'es',      // Español
      'en': 'en',      // Inglés
      'fr': 'fr',      // Francés
      'nl': 'nl',      // Holandés (Netherlands)
      'de': 'de',      // Alemán
      'ca': 'ca',      // Catalán
      'gl': 'gl',      // Gallego
      'eu': 'eu',      // Euskera
      'pt': 'pt',      // Portugués
      'val': 'ca',     // Valenciano (usa catalán)
      'valenciano': 'ca'
    };

    // Normalizar idioma (lowercase, sin espacios)
    const langKey = String(requestedLanguage).toLowerCase().trim();
    const detectedLanguage = supportedLanguages[langKey] || 'es'; // Fallback a español

    console.log('[Realtime] Idioma detectado:', detectedLanguage, '(solicitado:', requestedLanguage, ')');

    // ===== ORQUESTACIÓN DE CONTEXTO (Pipeline Gemini) =====
    // Consultar contexto completo: clima, hora, eventos
    let contextData = null;
    let sceneState = null;
    
    try {
      const timezone = req.body?.timezone || 'Europe/Madrid';
      const location = req.body?.location || 'Valencia';
      
      if (contextOrchestrator && contextOrchestrator.getContext) {
        contextData = await contextOrchestrator.getContext(timezone, location);
        sceneState = contextData.scene;
        
        console.log('[Realtime] Contexto obtenido:', {
          scene: sceneState.id,
          priority: sceneState.priority,
          look: sceneState.look,
          event: contextData.events?.active?.[0]?.name || 'ninguno'
        });
      }
    } catch (contextError) {
      console.warn('[Realtime] Error obteniendo contexto, usando valores por defecto:', contextError.message);
      // Continuar con valores por defecto
    }

    // Obtener instrucciones del sistema con contexto completo
    const systemInstructions = await getSandraInstructions(
      detectedLanguage,
      sceneState,
      contextData
    );

    // CONFIGURACIÓN ABSOLUTAMENTE MÍNIMA - Solo lo esencial
    // OpenAI Realtime API: crear sesión y obtener token efímero
    // NO incluir NINGÚN parámetro que no esté 100% documentado
    
    // CONFIGURACIÓN REALTIME TEXT-ONLY CORRECTA
    // Usando gpt-realtime-mini (7x más económico)
    // output_modalities: ['text'] para evitar generación de audio
    // SIN campos input_audio_format ni output_audio_format
    const sessionBody = {
      model: 'gpt-realtime-mini',
      instructions: systemInstructions || 'Eres Sandra, asistente de GuestsValencia. Responde brevemente en español.',
      output_modalities: ['text']  // ← PARÁMETRO CORRECTO para text-only
      // ← NO incluimos input_audio_format ni output_audio_format
      // Esto asegura que OpenAI NO genere audio, solo texto
    };

    // TEMPORALMENTE DESHABILITADO PARA DEBUGGING
    // Las herramientas pueden causar cierres prematuros de sesión
    // Descomentar después de confirmar que la llamada se mantiene activa
    /*
    try {
      const tools = await getToolDefinitions();
      if (tools && Array.isArray(tools) && tools.length > 0) {
        // Validar que cada herramienta tenga la estructura correcta
        const validTools = tools.filter(tool =>
          tool &&
          typeof tool === 'object' &&
          tool.type === 'function' &&
          typeof tool.name === 'string' &&
          typeof tool.description === 'string' &&
          tool.parameters &&
          typeof tool.parameters === 'object'
        );
        if (validTools.length > 0) {
          sessionBody.tools = validTools;
          sessionBody.tool_choice = 'auto';
        }
      }
    } catch (toolError) {
      console.warn('[Realtime] No se pudieron cargar herramientas, continuando sin ellas:', toolError.message);
    }
    */

    // NO agregar temperature, max_response_output_tokens ni otros parámetros opcionales
    // que puedan causar errores. La API usará valores por defecto.

    // Logging mejorado para debugging
    console.log('[Realtime] Creando sesión con configuración:', {
      model: sessionBody.model,
      voice: sessionBody.voice,
      modalities: sessionBody.modalities,
      turn_detection: sessionBody.turn_detection,
      hasTools: false, // Herramientas deshabilitadas temporalmente
      instructionsLength: systemInstructions.length,
      language: detectedLanguage
    });
    console.log('[Realtime] Body completo:', JSON.stringify(sessionBody, null, 2));

    const sessionResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1'
      },
      body: JSON.stringify(sessionBody)
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
      expires_at: sessionData.expires_at || sessionData.client_secret?.expires_at || null,
      // Incluir contexto de escena para el frontend
      context: contextData ? {
        scene: sceneState,
        weather: contextData.weather,
        time: contextData.time,
        events: contextData.events
      } : null
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
 * Obtener instrucciones del sistema prompt de Sandra (multilingüe + contexto)
 * Integra todo el pipeline de Gemini API
 */
async function getSandraInstructions(language = 'es', sceneState = null, contextData = null) {
  try {
    // Intentar cargar desde el archivo systemPrompt.js (CommonJS)
    const systemPromptModule = require('../../lib/systemPrompt.js');
    if (systemPromptModule && systemPromptModule.getSystemPrompt) {
      let basePrompt = systemPromptModule.getSystemPrompt();
      
      // ===== AGREGAR CONTEXTO DE ESCENA (Pipeline Gemini) =====
      if (sceneState && contextData) {
        const contextSection = `
## CONTEXTO ACTUAL DEL ENTORNO:

**Estado de Escena:** ${sceneState.id}
**Prioridad:** ${sceneState.priority}
**Look:** ${sceneState.look}
**Voz:** ${sceneState.voice}

${contextData.weather ? `**Clima:** ${contextData.weather.condition}, ${contextData.weather.temperature}°C` : ''}
${contextData.time ? `**Hora:** ${contextData.time.hour}:00, ${contextData.time.period}` : ''}
${contextData.events && contextData.events.active && contextData.events.active.length > 0 ? 
  `**Evento Activo:** ${contextData.events.active.map(e => e.name).join(', ')}` : ''}

## INSTRUCCIONES ESPECÍFICAS DEL CONTEXTO:

${sceneState.priority === 'event' ? `
- ESTAMOS EN UN EVENTO ESPECIAL: ${contextData.events.active[0].name}
- Menciona el evento en tu saludo inicial: "${sceneState.greeting}"
- Muestra entusiasmo y conocimiento sobre el evento
- Recomienda alojamientos destacando la proximidad al evento
- Los precios pueden estar ajustados por el evento (multiplicador: ${sceneState.priceMultiplier}x)
` : ''}

${sceneState.priority === 'time' ? `
- Saludo contextual según el momento: "${sceneState.greeting}"
- Adapta tu tono al período del día (${contextData.time?.period || 'day'})
${contextData.weather?.isRaining ? '- Menciona que aunque llueva, Valencia tiene mucho que ofrecer' : ''}
` : ''}

- Responde SIEMPRE en ${getLanguageName(sceneState?.language || language)}
- Mantén la personalidad de Sandra pero adaptada al contexto actual
`;
        
        basePrompt = basePrompt + contextSection;
      }
      
      // Agregar instrucción de idioma
      return `${basePrompt}\n\nIMPORTANTE: Responde siempre en el idioma que el usuario esté usando. Si habla en ${getLanguageName(language)}, responde en ${getLanguageName(language)}.`;
    }
  } catch (e) {
    console.warn('[Realtime] No se pudo cargar systemPrompt.js, usando fallback:', e.message);
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

Réponds toujours en français neutre, avec une bonne orthographe et grammaire. Sois brève et directe, maximum 4 phrases sauf si des détails sont demandés.`,

    'nl': `Je bent Sandra, de virtuele conciërge van GuestsValencia. Je bent vriendelijk, professioneel en altijd beschikbaar om gasten te helpen met hun accommodatiebehoeften in Valencia.

Je persoonlijkheid:
- Vriendelijk en gastvrij
- Professioneel en efficiënt
- Kennis van Valencia en zijn accommodaties
- Altijd bereid om te helpen

Je rol:
- Gasten helpen accommodaties te vinden
- Vragen beantwoorden over eigenschappen
- Reserveringen beheren
- Lokale aanbevelingen verstrekken

Antwoord altijd in neutraal Nederlands, met goede spelling en grammatica. Wees beknopt en direct, maximaal 4 zinnen tenzij details worden gevraagd.`,

    'de': `Du bist Sandra, die virtuelle Concierge von GuestsValencia. Du bist freundlich, professionell und immer verfügbar, um Gästen bei ihren Unterkunftsbedürfnissen in Valencia zu helfen.

Deine Persönlichkeit:
- Freundlich und einladend
- Professionell und effizient
- Kenntnisreich über Valencia und seine Unterkünfte
- Immer bereit zu helfen

Deine Rolle:
- Gästen helfen, Unterkünfte zu finden
- Fragen zu Immobilien beantworten
- Reservierungen verwalten
- Lokale Empfehlungen geben

Antworte immer in neutralem Deutsch, mit guter Rechtschreibung und Grammatik. Sei kurz und direkt, maximal 4 Sätze, es sei denn, Details werden angefordert.`,

    'ca': `Ets Sandra, la conserge virtual de GuestsValencia. Ets amable, professional i sempre disponible per ajudar els hostes amb les seues necessitats d'allotjament a València.

La teua personalitat:
- Amable i acollidora
- Professional i eficient
- Coneixedora de València i els seus allotjaments
- Sempre disposada a ajudar

El teu rol:
- Ajudar els hostes a trobar allotjaments
- Respondre preguntes sobre propietats
- Gestionar reserves
- Proporcionar recomanacions locals

Respon sempre en valencià/català neutre, amb bona ortografia i gramàtica. Sigues breu i directa, màxim 4 frases llevat que es demane detall.`,

    'gl': `Eres Sandra, a conserxe virtual de GuestsValencia. Eres amable, profesional e sempre dispoñible para axudar aos hóspedes coas súas necesidades de aloxamento en Valencia.

A túa personalidade:
- Amable e acolledora
- Profesional e eficiente
- Coñecedora de Valencia e os seus aloxamentos
- Sempre disposta a axudar

O teu rol:
- Axudar aos hóspedes a atopar aloxamentos
- Responder preguntas sobre propiedades
- Xestionar reservas
- Proporcionar recomendacións locais

Responde sempre en galego neutro, con boa ortografía e gramática. Sé breve e directa, máximo 4 frases salvo que se pida detalle.`,

    'eu': `Zu zara Sandra, GuestsValenciako birtualeko kontserjea. Atsegina, profesionala eta beti eskuragarri zara bisitariei Valentziako ostatu beharretan laguntzeko.

Zure nortasuna:
- Atsegina eta ongietorrizkoa
- Profesionala eta eraginkorra
- Valentzia eta bere ostatuak ezagutzen dituzu
- Beti laguntzeko prest

Zure rola:
- Bisitariei ostatuak aurkitzen laguntzea
- Etxeei buruzko galderak erantzutea
- Erreserbak kudeatzea
- Tokiko gomendioak ematea

Beti erantzun euskara neutroan, ortografia eta gramatika onarekin. Labur eta zuzena izan, gehienez 4 esaldi xehetasuna eskatzen ez bada.`,

    'pt': `És a Sandra, a conserje virtual da GuestsValencia. És amigável, profissional e sempre disponível para ajudar os hóspedes com as suas necessidades de alojamento em Valência.

A tua personalidade:
- Amigável e acolhedora
- Profissional e eficiente
- Conhecedora de Valência e os seus alojamentos
- Sempre disposta a ajudar

O teu papel:
- Ajudar os hóspedes a encontrar alojamentos
- Responder perguntas sobre propriedades
- Gerir reservas
- Fornecer recomendações locais

Responde sempre em português neutro, com boa ortografia e gramática. Sê breve e direta, máximo 4 frases a menos que seja solicitado detalhe.`
  };

  return prompts[language] || prompts['es'];
}

/**
 * Obtener nombre del idioma en su propio idioma
 */
function getLanguageName(languageCode) {
  const names = {
    'es': 'español',
    'en': 'English',
    'fr': 'français',
    'nl': 'Nederlands',
    'de': 'Deutsch',
    'ca': 'valencià/català',
    'gl': 'galego',
    'eu': 'euskara',
    'pt': 'português'
  };
  return names[languageCode] || 'español';
}

/**
 * Obtener todas las definiciones de herramientas (Function Calling)
 * Basado en el sistema completo de Sandra
 */
async function getToolDefinitions() {
  try {
    const systemPromptModule = require('../../lib/systemPrompt.js');
    if (systemPromptModule && systemPromptModule.getToolDefinitions) {
      const tools = systemPromptModule.getToolDefinitions();
      
      // Convertir al formato de OpenAI Realtime API
      return tools.map(tool => ({
        type: 'function',
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }));
    }
  } catch (e) {
    console.warn('[Realtime] No se pudieron cargar todas las herramientas, usando básicas:', e.message);
  }
  
  // Fallback: herramientas básicas
  return [
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
  ];
}

