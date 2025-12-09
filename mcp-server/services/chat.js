/**
 * Chat Service - Interfaz de texto
 * Modelos: DeepSeek R1 + Qwen
 * Fallback automático según latencia/disponibilidad
 */

const https = require('https');

class ChatService {
  constructor() {
    this.models = {
      primary: 'deepseek-chat', // DeepSeek R1
      secondary: 'qwen', // Qwen
      fallback: 'gpt-4o' // OpenAI como último recurso
    };
    this.ready = true;
  }

  isReady() {
    return this.ready;
  }

  async processMessage(message, options = {}) {
    const { context = '', model = null } = options;
    
    try {
      // Intentar modelo primario (DeepSeek)
      try {
        return await this.callDeepSeek(message, context);
      } catch (error) {
        console.warn('DeepSeek falló, intentando Qwen...', error.message);
        
        // Fallback a Qwen
        try {
          return await this.callQwen(message, context);
        } catch (error2) {
          console.warn('Qwen falló, usando OpenAI fallback...', error2.message);
          
          // Último recurso: OpenAI
          return await this.callOpenAI(message, context);
        }
      }
    } catch (error) {
      throw new Error(`Todos los modelos fallaron: ${error.message}`);
    }
  }

  async callDeepSeek(message, context) {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY no configurada');
    }

    const response = await this.makeRequest('api.deepseek.com', '/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: context || 'Eres Sandra IA, asistente inteligente de GuestsValencia.' },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 2000
    }, {
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    });

    return {
      text: response.choices[0].message.content,
      model: 'deepseek-chat',
      usage: response.usage
    };
  }

  async callQwen(message, context) {
    if (!process.env.QWEN_API_KEY && !process.env.GEMINI_API_KEY) {
      throw new Error('QWEN_API_KEY o GEMINI_API_KEY no configuradas');
    }

    // Usar Gemini como proxy para Qwen si no hay Qwen directo
    const apiKey = process.env.QWEN_API_KEY || process.env.GEMINI_API_KEY;
    const url = process.env.QWEN_API_KEY 
      ? 'dashscope.aliyuncs.com'
      : 'generativelanguage.googleapis.com';
    
    const endpoint = process.env.QWEN_API_KEY
      ? '/api/v1/services/aigc/text-generation/generation'
      : '/v1beta/models/gemini-pro:generateContent';

    const response = await this.makeRequest(url, endpoint, {
      model: 'qwen-turbo',
      input: {
        messages: [
          { role: 'system', content: context || 'Eres Sandra IA.' },
          { role: 'user', content: message }
        ]
      }
    }, {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    });

    return {
      text: response.output?.text || response.candidates[0].content.parts[0].text,
      model: 'qwen',
      usage: response.usage
    };
  }

  async callOpenAI(message, context) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no configurada');
    }

    const response = await this.makeRequest('api.openai.com', '/v1/chat/completions', {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: context || 'Eres Sandra IA, asistente inteligente.' },
        { role: 'user', content: message }
      ],
      temperature: 0.7
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

