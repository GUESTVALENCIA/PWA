const config = require('../config/config');
const { handleRequest } = require('../utils/apiClient');

class GroqService {
  constructor() {
    this.baseUrl = 'https://api.groq.com/openai/v1';
  }

  async callGroqQwen(systemPrompt, userMessage, history = [], modelId = 'qwen-main') {
    const modelMap = {
      'qwen-main': 'qwen-2.5-32b',
      'qwen-fast': 'qwen-2.5-coder-32b',
      'qwen-instruct': 'qwen-2.5-32b',
      'qwen-creative': 'qwen-2.5-32b'
    };

    const groqModel = modelMap[modelId] || 'qwen-2.5-32b';

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: userMessage }
    ];

    const payload = {
      model: groqModel,
      messages: messages,
      temperature: 0.7,
      max_tokens: 4096
    };

    const data = await handleRequest(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKeys.groq}`
      },
      body: JSON.stringify(payload)
    });

    return {
      text: data.choices[0].message.content,
      model: data.model,
      usage: data.usage
    };
  }
}

module.exports = new GroqService();
