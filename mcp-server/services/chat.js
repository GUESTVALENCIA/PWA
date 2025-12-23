/**
 * Chat Service - Interfaz de texto
 * Modelos: GPT-4o (OpenAI) > Groq (Qwen/DeepSeek) > Gemini
 * Fallback automático según disponibilidad
 */

const https = require('https');

class ChatService {
  constructor() {
    this.models = {
      primary: 'gpt-4o', // OpenAI GPT-4o
      secondary: 'qwen/qwen-2.5-72b-instruct', // Groq Qwen
      tertiary: 'deepseek/deepseek-r1', // Groq DeepSeek
      fallback: 'gemini-2.5-flash-lite' // Gemini como último recurso
    };
    this.ready = true;
  }

  isReady() {
    return this.ready;
  }

  async processMessage(message, options = {}) {
    const { context = '', model = null } = options;
    
    // ESTRATEGIA: GPT-4o > Groq (Qwen) > Groq (DeepSeek) > Gemini
    try {
      // 1. Intentar GPT-4o (OpenAI)
      try {
        return await this.callOpenAI(message, context);
      } catch (error) {
        console.warn(' OpenAI falló, intentando Groq (Qwen)...', error.message);
        
        // 2. Fallback a Groq (Qwen)
        try {
          return await this.callGroqQwen(message, context);
        } catch (error2) {
          console.warn(' Groq Qwen falló, intentando Groq (DeepSeek)...', error2.message);
          
          // 3. Fallback a Groq (DeepSeek)
          try {
            return await this.callGroqDeepSeek(message, context);
          } catch (error3) {
            console.warn(' Groq DeepSeek falló, usando Gemini como último recurso...', error3.message);
            
            // 4. Último recurso: Gemini
            return await this.callGemini(message, context);
          }
        }
      }
    } catch (error) {
      throw new Error(`Todos los modelos fallaron: ${error.message}`);
    }
  }

  async callOpenAI(message, context) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no configurada');
    }

    const response = await this.makeRequest('api.openai.com', '/v1/chat/completions', {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: context || 'Eres Sandra IA, asistente inteligente de GuestsValencia.' },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 2000
    }, {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    });

    return {
      text: response.choices[0].message.content,
      model: 'gpt-4o',
      usage: response.usage
    };
  }

  async callGroqQwen(message, context) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY no configurada');
    }

    const response = await this.makeRequest('api.groq.com', '/openai/v1/chat/completions', {
      model: 'qwen/qwen-2.5-72b-instruct',
      messages: [
        { role: 'system', content: context || 'Eres Sandra IA, asistente inteligente de GuestsValencia.' },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 2000
    }, {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    });

    return {
      text: response.choices[0].message.content,
      model: 'qwen/qwen-2.5-72b-instruct',
      usage: response.usage
    };
  }

  async callGroqDeepSeek(message, context) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY no configurada');
    }

    const response = await this.makeRequest('api.groq.com', '/openai/v1/chat/completions', {
      model: 'deepseek/deepseek-r1',
      messages: [
        { role: 'system', content: context || 'Eres Sandra IA, asistente inteligente de GuestsValencia.' },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 2000
    }, {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    });

    return {
      text: response.choices[0].message.content,
      model: 'deepseek/deepseek-r1',
      usage: response.usage
    };
  }

  async callGemini(message, context) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no configurada');
    }

    const systemPrompt = context || 'Eres Sandra IA, asistente inteligente de GuestsValencia.';
    const fullPrompt = `${systemPrompt}\n\nUsuario: ${message}\n\nSandra:`;

    const response = await this.makeRequest(
      'generativelanguage.googleapis.com',
      `/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000
        }
      },
      {
        'Content-Type': 'application/json'
      }
    );

    return {
      text: response.candidates[0].content.parts[0].text,
      model: 'gemini-2.5-flash-lite',
      usage: response.usageMetadata
    };
  }

  makeRequest(hostname, path, data, headers) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname,
        path,
        method: 'POST',
        headers
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

  async handleWebSocket(action, payload, ws) {
    switch (action) {
      case 'message':
        return await this.processMessage(payload.message, payload.options);
      case 'stream':
        // Implementar streaming
        return { streaming: true };
      default:
        return { error: 'Unknown action' };
    }
  }
}

module.exports = ChatService;

