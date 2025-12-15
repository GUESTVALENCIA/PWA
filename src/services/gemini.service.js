const config = require('../config/config');
const { handleRequest, AppError } = require('../utils/apiClient');

class GeminiService {
  constructor() {
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.model = 'gemini-2.5-flash';
  }

  async generateContent(prompt, systemPrompt) {
    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${config.apiKeys.gemini}`;
    const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}`;

    const payload = {
      contents: [{
        parts: [{ text: fullPrompt }]
      }]
    };

    try {
      const data = await handleRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!data.candidates || !data.candidates[0].content) {
        throw new AppError('Invalid response from Gemini', 500);
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Gemini Service Error:', error);
        throw error;
    }
  }

  // Used for WebSocket/Streaming scenarios (simplified for now)
  async generateContentStream(messages) {
      // Implementation depends on specific requirements, keeping it basic for now
      // This is a placeholder for the logic in server-websocket.js
  }
}

module.exports = new GeminiService();
