/**
 * LLM Streaming Service
 * Multi-provider LLM routing with streaming support
 *
 * Providers:
 * - Gemini 2.0 Flash (default, fastest)
 * - Claude 3.5 Sonnet (best quality)
 * - OpenAI GPT-4o-mini (fallback)
 *
 * Features:
 * - Streaming text generation
 * - Conversation history management
 * - Provider fallback on error
 * - Configurable parameters (temperature, tokens)
 */

const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const { logger } = require('../utils/logger');

class LLMStreamingService {
  constructor(config = {}) {
    this.provider = config.provider || process.env.DEFAULT_LLM_PROVIDER || 'gemini';
    this.conversationHistory = [];
    this.maxHistoryItems = config.maxHistoryItems || 10;

    // Initialize clients
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropicClient = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }

    if (process.env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }

    if (process.env.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }

    this.config = {
      temperature: config.temperature || 0.9,
      maxTokens: config.maxTokens || 150,
      ...config
    };
  }

  /**
   * Stream LLM response
   * Yields text chunks as they're generated
   */
  async *streamResponse(userMessage, systemPrompt = null) {
    const startTime = Date.now();
    const requestId = `llm-${startTime}`;

    try {
      logger.info(`🧠 LLM Request (${this.provider}): "${userMessage.substring(0, 50)}..."`);

      // Add to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage
      });

      // Get LLM response
      const providers = this.getProviderChain();
      let fullResponse = '';

      for (const provider of providers) {
        try {
          logger.debug(`Trying provider: ${provider.name}`);

          for await (const chunk of provider.stream(
            userMessage,
            systemPrompt,
            this.conversationHistory
          )) {
            fullResponse += chunk;
            yield chunk;
          }

          break;  // Success
        } catch (error) {
          logger.warn(`⚠️  ${provider.name} failed: ${error.message}`);
          continue;
        }
      }

      if (!fullResponse) {
        throw new Error('All LLM providers failed');
      }

      // Add to history
      this.conversationHistory.push({
        role: 'assistant',
        content: fullResponse
      });

      // Maintain history size
      if (this.conversationHistory.length > this.maxHistoryItems) {
        this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryItems);
      }

      const latency = Date.now() - startTime;
      logger.info(`✅ LLM complete in ${latency}ms (${requestId})`);

    } catch (error) {
      logger.error(`❌ LLM error (${requestId}):`, error.message);
      throw error;
    }
  }

  /**
   * Get provider chain
   */
  getProviderChain() {
    const providers = [];
    const order = [this.provider, 'gemini', 'claude', 'openai'];

    for (const providerName of order) {
      if (!providers.find(p => p.name === providerName)) {
        const provider = this.createProvider(providerName);
        if (provider) {
          providers.push(provider);
        }
      }
    }

    return providers;
  }

  /**
   * Create provider
   */
  createProvider(providerName) {
    switch (providerName) {
      case 'gemini':
        if (!this.genAI) return null;
        return {
          name: 'Gemini',
          stream: (msg, system, history) => this.streamGemini(msg, system, history)
        };

      case 'claude':
        if (!this.anthropicClient) return null;
        return {
          name: 'Claude',
          stream: (msg, system, history) => this.streamClaude(msg, system, history)
        };

      case 'openai':
        if (!this.openaiClient) return null;
        return {
          name: 'OpenAI',
          stream: (msg, system, history) => this.streamOpenAI(msg, system, history)
        };

      default:
        return null;
    }
  }

  /**
   * Stream from Gemini 2.0 Flash
   */
  async *streamGemini(userMessage, systemPrompt, history) {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: systemPrompt || this.getDefaultSystemPrompt()
    });

    const messages = this.formatHistoryForGemini(history);
    const result = await model.generateContentStream(messages);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }

  /**
   * Stream from Claude
   */
  async *streamClaude(userMessage, systemPrompt, history) {
    const stream = await this.anthropicClient.messages.stream({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: systemPrompt || this.getDefaultSystemPrompt(),
      messages: this.formatHistoryForClaude(history)
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  }

  /**
   * Stream from OpenAI
   */
  async *streamOpenAI(userMessage, systemPrompt, history) {
    const stream = await this.openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      stream: true,
      system: systemPrompt || this.getDefaultSystemPrompt(),
      messages: this.formatHistoryForOpenAI(history)
    });

    for await (const chunk of stream) {
      if (chunk.choices?.[0]?.delta?.content) {
        yield chunk.choices[0].delta.content;
      }
    }
  }

  /**
   * Format history for Gemini
   */
  formatHistoryForGemini(history) {
    return history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
  }

  /**
   * Format history for Claude
   */
  formatHistoryForClaude(history) {
    return history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Format history for OpenAI
   */
  formatHistoryForOpenAI(history) {
    return history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Get default system prompt
   */
  getDefaultSystemPrompt() {
    return `You are a helpful, professional conversational AI assistant.
Your responses should be natural, concise (1-3 sentences), and conversational.
Keep responses short for real-time voice interactions.
Be friendly and helpful.`;
  }

  /**
   * Reset conversation
   */
  resetConversation() {
    this.conversationHistory = [];
    logger.info('🔄 Conversation reset');
  }

  /**
   * Get conversation history
   */
  getHistory() {
    return this.conversationHistory;
  }

  /**
   * Health check
   */
  async healthCheck() {
    const providers = {};

    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        await model.generateContent('test');
        providers.gemini = { healthy: true };
      } catch (e) {
        providers.gemini = { healthy: false, error: e.message };
      }
    }

    if (this.anthropicClient) {
      try {
        await this.anthropicClient.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        });
        providers.claude = { healthy: true };
      } catch (e) {
        providers.claude = { healthy: false, error: e.message };
      }
    }

    if (this.openaiClient) {
      try {
        await this.openaiClient.chat.completions.create({
          model: 'gpt-4o-mini',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        });
        providers.openai = { healthy: true };
      } catch (e) {
        providers.openai = { healthy: false, error: e.message };
      }
    }

    return providers;
  }
}

module.exports = LLMStreamingService;
