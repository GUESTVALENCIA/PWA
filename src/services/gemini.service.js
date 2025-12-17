const config = require('../config/config');
const { handleRequest, AppError } = require('../utils/apiClient');

class GeminiService {
  constructor() {
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.model = 'gemini-2.0-flash-exp'; // Using the latest experimental model for speed/quality
  }

  async generateContent(prompt, systemPrompt) {
    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${config.apiKeys.gemini}`;

    // Construct the payload with system instructions if supported, or prepended
    // Gemini 1.5/2.0 supports systemInstruction
    const payload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    };

    try {
      const data = await handleRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!data.candidates || !data.candidates[0].content) {
        // Fallback for safety blocks or empty responses
        console.warn('Gemini response might be blocked or empty:', JSON.stringify(data));
        if (data.promptFeedback && data.promptFeedback.blockReason) {
             throw new AppError(`Gemini blocked response: ${data.promptFeedback.blockReason}`, 400);
        }
        throw new AppError('Invalid response from Gemini', 500);
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Gemini Service Error:', error);
        throw error;
    }
  }
}

module.exports = new GeminiService();
