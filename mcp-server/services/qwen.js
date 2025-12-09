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
    // Verificar API keys disponibles
    if (process.env.QWEN_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY) {
      this.ready = true;
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
    
    // Intentar Qwen, fallback a Gemini u OpenAI
    try {
      return await this.callQwen(message, fullContext, role);
    } catch (error) {
      console.warn('Qwen falló, usando fallback:', error.message);
      
      try {
        return await this.callGemini(message, fullContext, role);
      } catch (error2) {
        console.warn('Gemini falló, usando OpenAI:', error2.message);
        return await this.callOpenAI(message, fullContext, role);
      }
    }
  }

  async callQwen(message, context, role) {
    if (!process.env.QWEN_API_KEY) {
      throw new Error('QWEN_API_KEY no configurada');
    }

    // Usar Gemini como proxy si Qwen directo no está disponible
    return await this.callGemini(message, context, role);
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

