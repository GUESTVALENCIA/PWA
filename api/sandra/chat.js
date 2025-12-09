// Vercel Serverless Function - Sandra Chat API
// Endpoint: /api/sandra/chat

const https = require('https');

/**
 * Detecta el entorno actual para seleccionar el modelo de IA
 * @returns {string} 'development' | 'staging' | 'production'
 */
function getEnv(req) {
  const hostname = req?.headers?.host || '';
  
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return 'development';
  }
  if (hostname.includes('staging') || hostname.includes('preview') || 
      (hostname.includes('.vercel.app') && !hostname.includes('guestsvalencia'))) {
    return 'staging';
  }
  if (hostname.includes('guestsvalencia.com')) {
    return 'production';
  }
  
  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
}

/**
 * AutoSelector de IA por entorno para Sandra
 * @returns {string} Modelo por defecto según entorno
 */
function getDefaultModel(req) {
  const env = getEnv(req);
  
  if (env === 'production') return 'gpt-4o';
  if (env === 'staging') return 'gemini-pro';
  return 'mixtral-8x7b'; // Desarrollo
}

// Reglas conversacionales
const GLOBAL_CONVERSATION_RULES = `
REGLAS CONVERSACIONALES GLOBALES (Sandra IA 8.0 Pro):
- IMPORTANTE: Sandra SÍ puede realizar llamadas de voz conversacionales en tiempo real. Cuando un usuario solicite "llamada de voz", "llamada conversacional" o "hablar contigo", debes ofrecerle amablemente esta opción. NO es una videollamada, es una llamada de voz en tiempo real con audio bidireccional.
- Responde SIEMPRE en español neutro, con buena ortografía y gramática.
- Usa párrafos cortos y bien separados.
- Actúa como una experta en Hospitalidad y Turismo para Guests Valencia.
- Si te preguntan por disponibilidad, ofrece revisar datos en tiempo real.
- Brevedad estricta: máximo 4 frases salvo que se pida detalle.
`;

// Llamada a Gemini API
function callGemini(prompt, context = 'luxury') {
  return new Promise((resolve, reject) => {
    const fullSystemPrompt = `${GLOBAL_CONVERSATION_RULES}\nRole: ${context}`;
    
    const postData = JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      systemInstruction: {
        parts: [{ text: fullSystemPrompt }]
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
          reject(new Error(`Gemini Error: ${res.statusCode}`));
          return;
        }
        try {
          const json = JSON.parse(data);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
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

// Llamada a OpenAI GPT-4o API
function callGPT4o(prompt, context = 'luxury') {
  return new Promise((resolve, reject) => {
    const fullSystemPrompt = `${GLOBAL_CONVERSATION_RULES}\nRole: ${context}`;
    
    const postData = JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: fullSystemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
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
          const text = json.choices?.[0]?.message?.content || '';
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

// Llamada a Groq Mixtral 8x7b API
function callGroq(prompt, context = 'luxury') {
  return new Promise((resolve, reject) => {
    const fullSystemPrompt = `${GLOBAL_CONVERSATION_RULES}\nRole: ${context}`;
    
    const postData = JSON.stringify({
      model: 'mixtral-8x7b-32768',
      messages: [
        { role: 'system', content: fullSystemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Groq Error: ${res.statusCode}`));
          return;
        }
        try {
          const json = JSON.parse(data);
          const text = json.choices?.[0]?.message?.content || '';
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

// Función unificada que selecciona el modelo según el entorno
async function callAI(prompt, context, req) {
  const model = getDefaultModel(req);
  const env = getEnv(req);
  
  console.log(`🤖 [Sandra Chat] Entorno: ${env}, Modelo seleccionado: ${model}`);
  
  try {
    switch (model) {
      case 'gpt-4o':
        if (!process.env.OPENAI_API_KEY) {
          throw new Error('OPENAI_API_KEY no configurada');
        }
        return await callGPT4o(prompt, context);
        
      case 'gemini-pro':
        if (!process.env.GEMINI_API_KEY) {
          throw new Error('GEMINI_API_KEY no configurada');
        }
        return await callGemini(prompt, context);
        
      case 'mixtral-8x7b':
        if (!process.env.GROQ_API_KEY) {
          throw new Error('GROQ_API_KEY no configurada');
        }
        return await callGroq(prompt, context);
        
      default:
        // Fallback a Gemini si el modelo no está reconocido
        if (process.env.GEMINI_API_KEY) {
          console.warn(`⚠️ Modelo ${model} no reconocido, usando Gemini como fallback`);
          return await callGemini(prompt, context);
        }
        throw new Error(`Modelo ${model} no soportado y no hay fallback disponible`);
    }
  } catch (error) {
    // Si falla el modelo principal, intentar fallback
    console.error(`❌ Error con modelo ${model}:`, error.message);
    
    // Fallback a Gemini si está disponible
    if (model !== 'gemini-pro' && process.env.GEMINI_API_KEY) {
      console.log('🔄 Intentando fallback a Gemini...');
      try {
        return await callGemini(prompt, context);
      } catch (fallbackError) {
        console.error('❌ Fallback a Gemini también falló:', fallbackError.message);
        throw error; // Lanzar error original
      }
    }
    
    throw error;
  }
}

// Handler de Vercel
module.exports = async (req, res) => {
  // Utilidad para detectar entorno en serverless
  const getEnv = () => {
    const hostname = req?.headers?.host || '';
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return 'development';
    }
    if (hostname.includes('staging') || hostname.includes('preview') || hostname.includes('.vercel.app')) {
      return 'staging';
    }
    if (hostname.includes('guestsvalencia.com')) {
      return 'production';
    }
    return process.env.NODE_ENV === 'production' ? 'production' : 'development';
  };
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, role = 'luxury' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Obtener modelo por defecto según entorno
    const model = getDefaultModel(req);
    const env = getEnv(req);
    
    // Verificar que al menos una API key esté configurada
    const requiredKeys = {
      'gpt-4o': 'OPENAI_API_KEY',
      'gemini-pro': 'GEMINI_API_KEY',
      'mixtral-8x7b': 'GROQ_API_KEY'
    };
    
    const requiredKey = requiredKeys[model];
    if (!process.env[requiredKey]) {
      console.error(`⚠️ ${requiredKey} no configurada para modelo ${model} en entorno ${env}`);
      return res.status(500).json({ 
        error: `${requiredKey} debe estar configurada para usar el modelo ${model} en entorno ${env}` 
      });
    }

    // Llamar al modelo seleccionado según entorno
    const reply = await callAI(message, role, req);
    
    return res.status(200).json({ 
      reply,
      model: model, // Información adicional para debugging
      env: env
    });
  } catch (error) {
    console.error('Sandra Chat Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

