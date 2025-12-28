/**
 * Node.js Server Example - Realtime Voice System Integration
 *
 * Shows how to integrate the realtime voice system into a Node.js backend
 * Use cases: Bot servers, API integrations, voice processing pipelines
 *
 * Usage:
 * const voiceBot = new VoiceBot({
 *   serverUrl: 'ws://localhost:4042',
 *   language: 'es'
 * });
 *
 * const result = await voiceBot.processAudio(audioBuffer);
 */

const { RealtimeVoiceClient } = require('../core/client/src/realtime-voice-client');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class VoiceBot extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      serverUrl: config.serverUrl || 'ws://localhost:4042',
      language: config.language || 'es',
      llmProvider: config.llmProvider || 'gemini',
      autoSave: config.autoSave || false,
      saveDir: config.saveDir || './conversations',
      debug: config.debug || false,
      ...config
    };

    this.client = null;
    this.isInitialized = false;
    this.conversationId = null;
    this.transcriptions = [];
    this.responses = [];
  }

  /**
   * Initialize connection
   */
  async initialize() {
    try {
      console.log('[VoiceBot] Initializing...');

      this.client = new RealtimeVoiceClient({
        serverUrl: this.config.serverUrl,
        language: this.config.language,
        debug: this.config.debug
      });

      // Setup event handlers
      this.client.on('ready', () => {
        console.log('[VoiceBot] Ready');
        this.emit('ready');
      });

      this.client.on('transcription', (text) => {
        console.log('[VoiceBot] Transcription:', text);
        this.transcriptions.push({
          timestamp: Date.now(),
          text
        });
        this.emit('transcription', text);
      });

      this.client.on('text', (chunk) => {
        console.log('[VoiceBot] Response chunk:', chunk.substring(0, 50));
        this.emit('response_chunk', chunk);
      });

      this.client.on('response_complete', (data) => {
        console.log('[VoiceBot] Response complete');
        this.responses.push({
          timestamp: Date.now(),
          text: data.text
        });
        this.emit('response_complete', data);
      });

      this.client.on('error', (error) => {
        console.error('[VoiceBot] Error:', error);
        this.emit('error', error);
      });

      this.client.on('disconnected', () => {
        console.log('[VoiceBot] Disconnected');
        this.isInitialized = false;
        this.emit('disconnected');
      });

      // Connect
      await this.client.connect();

      this.isInitialized = true;
      this.conversationId = `conv-${Date.now()}`;

      console.log('[VoiceBot] Initialized successfully');

    } catch (error) {
      console.error('[VoiceBot] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Process audio file
   *
   * Usage:
   * const result = await voiceBot.processAudioFile('./audio.wav');
   */
  async processAudioFile(filePath) {
    try {
      if (!this.isInitialized) {
        throw new Error('VoiceBot not initialized. Call initialize() first.');
      }

      console.log('[VoiceBot] Processing audio file:', filePath);

      // Read audio file
      const audioBuffer = await fs.readFile(filePath);

      // Send to server
      return new Promise((resolve, reject) => {
        let fullResponse = '';
        let completedAt = null;

        const responseHandler = (chunk) => {
          fullResponse += chunk;
        };

        const completeHandler = (data) => {
          completedAt = Date.now();
          this.client.off('text', responseHandler);
          this.client.off('response_complete', completeHandler);

          resolve({
            conversationId: this.conversationId,
            transcriptions: [...this.transcriptions],
            response: fullResponse,
            processingTime: completedAt - processingStarted
          });
        };

        const errorHandler = (error) => {
          this.client.off('text', responseHandler);
          this.client.off('response_complete', completeHandler);
          this.client.off('error', errorHandler);
          reject(error);
        };

        // Listen for responses
        this.client.on('text', responseHandler);
        this.client.on('response_complete', completeHandler);
        this.client.on('error', errorHandler);

        // Send audio
        const processingStarted = Date.now();
        this.client.sendAudio(audioBuffer);

        // Timeout after 30 seconds
        setTimeout(() => {
          this.client.off('text', responseHandler);
          this.client.off('response_complete', completeHandler);
          this.client.off('error', errorHandler);
          reject(new Error('Audio processing timeout'));
        }, 30000);
      });
    } catch (error) {
      console.error('[VoiceBot] Failed to process audio file:', error);
      throw error;
    }
  }

  /**
   * Process audio buffer
   */
  async processAudioBuffer(audioBuffer) {
    try {
      if (!this.isInitialized) {
        throw new Error('VoiceBot not initialized. Call initialize() first.');
      }

      return new Promise((resolve, reject) => {
        let fullResponse = '';
        let completedAt = null;

        const responseHandler = (chunk) => {
          fullResponse += chunk;
        };

        const completeHandler = (data) => {
          completedAt = Date.now();
          this.client.off('text', responseHandler);
          this.client.off('response_complete', completeHandler);

          resolve({
            conversationId: this.conversationId,
            transcriptions: [...this.transcriptions],
            response: fullResponse,
            processingTime: completedAt - processingStarted
          });
        };

        const errorHandler = (error) => {
          this.client.off('text', responseHandler);
          this.client.off('response_complete', completeHandler);
          this.client.off('error', errorHandler);
          reject(error);
        };

        // Listen for responses
        this.client.on('text', responseHandler);
        this.client.on('response_complete', completeHandler);
        this.client.on('error', errorHandler);

        // Send audio
        const processingStarted = Date.now();
        this.client.sendAudio(audioBuffer);

        // Timeout
        setTimeout(() => {
          this.client.off('text', responseHandler);
          this.client.off('response_complete', completeHandler);
          this.client.off('error', errorHandler);
          reject(new Error('Audio processing timeout'));
        }, 30000);
      });
    } catch (error) {
      console.error('[VoiceBot] Failed to process audio buffer:', error);
      throw error;
    }
  }

  /**
   * Set language
   */
  setLanguage(language) {
    if (this.client && this.isInitialized) {
      this.config.language = language;
      this.client.setLanguage(language);
      console.log('[VoiceBot] Language set to:', language);
    }
  }

  /**
   * Set LLM provider
   */
  setLLMProvider(provider) {
    if (this.client && this.isInitialized) {
      this.config.llmProvider = provider;
      this.client.setLLMProvider(provider);
      console.log('[VoiceBot] LLM provider set to:', provider);
    }
  }

  /**
   * Reset conversation
   */
  resetConversation() {
    if (this.client && this.isInitialized) {
      this.client.reset();
      this.transcriptions = [];
      this.responses = [];
      this.conversationId = `conv-${Date.now()}`;
      console.log('[VoiceBot] Conversation reset');
    }
  }

  /**
   * Get conversation history
   */
  getConversationHistory() {
    return {
      conversationId: this.conversationId,
      transcriptions: this.transcriptions,
      responses: this.responses
    };
  }

  /**
   * Save conversation to file
   */
  async saveConversation(filename = null) {
    try {
      const name = filename || `${this.conversationId}.json`;
      const filepath = path.join(this.config.saveDir, name);

      // Ensure directory exists
      await fs.mkdir(this.config.saveDir, { recursive: true });

      // Write conversation
      const data = {
        conversationId: this.conversationId,
        timestamp: new Date().toISOString(),
        language: this.config.language,
        llmProvider: this.config.llmProvider,
        transcriptions: this.transcriptions,
        responses: this.responses
      };

      await fs.writeFile(filepath, JSON.stringify(data, null, 2));

      console.log('[VoiceBot] Conversation saved to:', filepath);

      return filepath;

    } catch (error) {
      console.error('[VoiceBot] Failed to save conversation:', error);
      throw error;
    }
  }

  /**
   * Disconnect
   */
  disconnect() {
    if (this.client) {
      this.client.disconnect();
      this.isInitialized = false;
      console.log('[VoiceBot] Disconnected');
    }
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      conversationId: this.conversationId,
      language: this.config.language,
      llmProvider: this.config.llmProvider,
      transcriptions: this.transcriptions.length,
      responses: this.responses.length
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE USAGE
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  // Create bot
  const bot = new VoiceBot({
    serverUrl: 'ws://localhost:4042',
    language: 'es',
    llmProvider: 'gemini',
    debug: true
  });

  try {
    // Initialize
    await bot.initialize();

    // Wait for ready
    await new Promise(resolve => bot.once('ready', resolve));

    // Example 1: Process audio file
    console.log('\n--- Processing Audio File ---');
    const result = await bot.processAudioFile('./audio.wav');
    console.log('Result:', result);

    // Example 2: Change settings
    console.log('\n--- Changing Settings ---');
    bot.setLanguage('en');
    bot.setLLMProvider('claude');

    // Example 3: Get history
    console.log('\n--- Conversation History ---');
    const history = bot.getConversationHistory();
    console.log(history);

    // Example 4: Save conversation
    console.log('\n--- Saving Conversation ---');
    const filepath = await bot.saveConversation();
    console.log('Saved to:', filepath);

    // Cleanup
    bot.disconnect();

  } catch (error) {
    console.error('Error:', error);
  }
}

// Uncomment to run example
// main().catch(console.error);

module.exports = VoiceBot;
