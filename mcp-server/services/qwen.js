/**
 * Qwen Service
 * Procesamiento conversacional con Qwen
 * Rol: Conserje de Sandra IA
 */

const https = require('https');

class QwenService {
  constructor() {
    this.ready = false;
    this.models = {
      primary: 'qwen-turbo',
      vision: 'qwen-vl-max',
      audio: 'qwen-audio'
    };
    this.initialize();
  }

  async initialize() {
    // Verificar API key de Groq (requerida para desarrollo)
    if (process.env.GROQ_API_KEY) {
      this.ready = true;
      console.log('[GROQ] Servicio Qwen inicializado con Groq API');
    } else {
      console.warn('[GROQ] GROQ_API_KEY no configurada. El servicio no funcionará.');
    }
  }

  isReady() {
    return this.ready;
  }

  getStatus() {
    return {
      ready: this.ready,
      models: this.models,
      hasApiKey: !!(process.env.QWEN_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY)
    };
  }

  async processMessage(message, options = {}) {
    const { role = 'conserje', context = '', bridgeData = null, ambientation = null } = options;
    
    // Construir contexto completo
    let fullContext = context;
    
    if (ambientation) {
      fullContext += `\nAmbientación actual: ${ambientation.type} (${ambientation.time})`;
    }
    
    if (bridgeData) {
      fullContext += `\nContexto de reservas: ${JSON.stringify(bridgeData).substring(0, 500)}`;
    }
    
    // USAR GROQ DIRECTAMENTE (para desarrollo, sin fallbacks)
    try {
      return await this.callGroqQwen(message, fullContext, role);
    } catch (error) {
      console.error('[GROQ] Error en llamada conversacional:', error.message);
      throw error; // No usar fallbacks, solo Groq
    }
  }

  async callGroqQwen(message, context, role) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY no configurada. Necesaria para desarrollo.');
    }

    const systemPrompt = `Eres Sandra, la conserje virtual de GuestsValencia. ${context}`;

    // Modelos disponibles en Groq (2025) - Usar modelo confirmado
    const model = 'llama-3.1-8b-instant'; // Modelo confirmado funcionando en Groq
    
    const response = await this.makeRequest(
      'api.groq.com',
      '/openai/v1/chat/completions',
      {
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    );

    return {
      text: response.choices[0].message.content,
      model: model,
      usage: response.usage
    };
  }

  async callQwen(message, context, role) {
    // Redirigir a Groq
    return await this.callGroqQwen(message, context, role);
  }

  async callGemini(message, context, role) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no configurada');
    }

    const systemPrompt = `Eres Sandra, la conserje virtual de GuestsValencia. ${context}`;

    const response = await this.makeRequest(
      'generativelanguage.googleapis.com',
      `/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: `${systemPrompt}\n\nUsuario: ${message}\n\nSandra:` }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000
        }
      }
    );

    return {
      text: response.candidates[0].content.parts[0].text,
      model: 'gemini-2.5-flash',
      usage: response.usageMetadata
    };
  }

  async callOpenAI(message, context, role) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no configurada');
    }

    const systemPrompt = `Eres Sandra, la conserje virtual de GuestsValencia. ${context}`;

    const response = await this.makeRequest(
      'api.openai.com',
      '/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    );

    return {
      text: response.choices[0].message.content,
      model: 'gpt-4o',
      usage: response.usage
    };
  }

  makeRequest(hostname, path, data, headers = {}) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(json);
            } else {
              reject(new Error(`API Error: ${res.statusCode} - ${JSON.stringify(json)}`));
            }
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify(data));
      req.end();
    });
  }
}

module.exports = QwenService;

