/**
 * Gemini Service (Replacing Qwen as Primary)
 * Procesamiento conversacional con Gemini 3.0 Preview (o 2.0 Flash Exp)
 * Rol: Conserje de Sandra IA
 */

const https = require('https');

class GeminiService {
  constructor() {
    this.ready = false;
    // Updated to use the requested 3.0 preview or latest flash exp
    this.model = 'gemini-2.0-flash-exp';
    this.initialize();
  }

  async initialize() {
    if (process.env.GEMINI_API_KEY) {
      this.ready = true;
      console.log(' Gemini Service Initialized (Primary Provider)');
    } else {
        console.warn(' Gemini API Key missing!');
    }
  }

  isReady() {
    return this.ready;
  }

  getStatus() {
    return {
      ready: this.ready,
      model: this.model,
      provider: 'Google Gemini'
    };
  }

  async processMessage(message, options = {}) {
    const { role = 'conserje', context = '', bridgeData = null, ambientation = null } = options;

    if (!this.ready) throw new Error('Gemini Service not ready');

    // Construir contexto completo
    let fullContext = context;
    if (ambientation) fullContext += `\n[System: Weather is ${ambientation.type} (${ambientation.time})]`;
    if (bridgeData) fullContext += `\n[System: Booking Context: ${JSON.stringify(bridgeData).substring(0, 500)}]`;

    try {
      const response = await this.callGemini(message, fullContext);
      // Return simple string if caller expects it, or object if needed.
      // Existing Qwen service seemed to return object with .text sometimes or direct string?
      // Checking audio.js: it expects `aiResponse` to be text string from `services.qwen.processMessage`.
      return response.text;
    } catch (error) {
      console.error('Gemini Error:', error);
      return "Lo siento, tuve un problema conectando con mi cerebro central. ¿Podrías repetirlo?";
    }
  }

  async callGemini(message, context) {
    const systemPrompt = `
    Eres Sandra, la IA experta en hospitalidad de GuestsValencia.
    ${context}

    INSTRUCCIONES CLAVE:
    1. Respuestas breves y naturales (conversacionales).
    2. Si preguntan disponibilidad, simula consultar el sistema en tiempo real.
    3. Puedes regatear precios si el contexto lo permite, pero mantén un margen lógico.
    4. Estás conectada al servidor stream de Galaxy en tiempo real.
    `;

    const requestData = {
      contents: [{
        parts: [{ text: message }]
      }],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    };

    const response = await this.makeRequest(
      'generativelanguage.googleapis.com',
      `/v1beta/models/${this.model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      requestData
    );

    if (!response.candidates || !response.candidates[0].content) {
        throw new Error('Invalid Gemini Response');
    }

    return {
      text: response.candidates[0].content.parts[0].text,
      model: this.model,
      usage: response.usageMetadata
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

module.exports = GeminiService;
