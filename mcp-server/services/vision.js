/**
 * Vision Service - Entrada visual + tareas multimodales
 * Modelo: Qwen VL
 */

const https = require('https');

class VisionService {
  constructor() {
    this.ready = true;
  }

  isReady() {
    return this.ready && (!!process.env.QWEN_API_KEY || !!process.env.GEMINI_API_KEY || !!process.env.OPENAI_API_KEY);
  }

  async analyzeImage(image, prompt = 'Describe esta imagen') {
    // Intentar con diferentes modelos según disponibilidad
    
    // Prioridad 1: Qwen VL
    if (process.env.QWEN_API_KEY) {
      try {
        return await this.callQwenVL(image, prompt);
      } catch (error) {
        console.warn('Qwen VL falló:', error.message);
      }
    }

    // Prioridad 2: Gemini Vision
    if (process.env.GEMINI_API_KEY) {
      try {
        return await this.callGeminiVision(image, prompt);
      } catch (error) {
        console.warn('Gemini Vision falló:', error.message);
      }
    }

    // Prioridad 3: OpenAI Vision
    if (process.env.OPENAI_API_KEY) {
      try {
        return await this.callOpenAIVision(image, prompt);
      } catch (error) {
        console.warn('OpenAI Vision falló:', error.message);
      }
    }

    throw new Error('Ningún modelo de visión disponible');
  }

  async callQwenVL(image, prompt) {
    // Implementación para Qwen VL
    // Por ahora, usar Gemini como proxy
    return await this.callGeminiVision(image, prompt);
  }

  async callGeminiVision(image, prompt) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no configurada');
    }

    const imageData = typeof image === 'string' ? image.split(',')[1] : image.toString('base64');

    const response = await this.makeRequest('generativelanguage.googleapis.com', 
      `/v1beta/models/gemini-pro-vision:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: imageData
            }
          }
        ]
      }]
    }, {
      'Content-Type': 'application/json'
    });

    return {
      description: response.candidates[0].content.parts[0].text,
      model: 'gemini-pro-vision'
    };
  }

  async callOpenAIVision(image, prompt) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no configurada');
    }

    const imageData = typeof image === 'string' ? image : image.toString('base64');

    const response = await this.makeRequest('api.openai.com', '/v1/chat/completions', {
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageData}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    }, {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    });

    return {
      description: response.choices[0].message.content,
      model: 'gpt-4-vision-preview'
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
            resolve(JSON.parse(body));
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
      case 'analyze':
        return await this.analyzeImage(payload.image, payload.prompt);
      default:
        return { error: 'Unknown action' };
    }
  }
}

module.exports = VisionService;

