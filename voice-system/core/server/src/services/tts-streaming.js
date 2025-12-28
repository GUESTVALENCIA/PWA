/**
 * TTS Streaming Service Router
 * Supports multiple TTS providers with fallback chain
 *
 * Providers:
 * - MiVoz Native (recommended, native Spanish voices)
 * - Cartesia Sonic (fallback, low latency)
 * - ElevenLabs (fallback, high quality)
 *
 * Features:
 * - Provider routing
 * - Automatic fallback on failure
 * - Configurable priority order
 * - Health checks per provider
 */

const MiVozStreamingService = require('./mivoz-streaming');
const CartesiaService = require('./cartesia-streaming');
const ElevenLabsService = require('./elevenlabs-streaming');
const { logger } = require('../utils/logger');

class TTSStreamingService {
  constructor(config = {}) {
    this.provider = config.provider || process.env.DEFAULT_TTS_PROVIDER || 'mivoz';
    this.config = config;

    // Initialize providers
    this.providers = {};

    if (process.env.MIVOZ_API_KEY) {
      this.providers.mivoz = new MiVozStreamingService({
        apiKey: process.env.MIVOZ_API_KEY,
        voiceId: process.env.MIVOZ_VOICE_ID,
        ...config.mivoz
      });
    }

    if (process.env.CARTESIA_API_KEY) {
      this.providers.cartesia = new CartesiaService({
        apiKey: process.env.CARTESIA_API_KEY,
        ...config.cartesia
      });
    }

    if (process.env.ELEVENLABS_API_KEY) {
      this.providers.elevenlabs = new ElevenLabsService({
        apiKey: process.env.ELEVENLABS_API_KEY,
        ...config.elevenlabs
      });
    }
  }

  /**
   * Stream audio from text
   * Routes to appropriate provider with fallback
   */
  async *streamAudio(textStream, options = {}) {
    const providers = this.getProviderChain();

    if (providers.length === 0) {
      throw new Error('No TTS providers configured');
    }

    for (const provider of providers) {
      try {
        logger.info(`🎤 TTS Provider: ${provider.name}`);
        yield* await provider.service.streamAudio(textStream, options);
        return;  // Success
      } catch (error) {
        logger.warn(`⚠️  ${provider.name} failed: ${error.message}`);
        continue;  // Try next provider
      }
    }

    // All providers failed
    throw new Error('All TTS providers failed');
  }

  /**
   * Get provider chain (priority order)
   */
  getProviderChain() {
    const chain = [];
    const preferredOrder = [this.provider, 'cartesia', 'elevenlabs', 'mivoz'];

    for (const providerName of preferredOrder) {
      if (this.providers[providerName] && !chain.find(p => p.name === providerName)) {
        chain.push({
          name: this.getProviderDisplayName(providerName),
          service: this.providers[providerName]
        });
      }
    }

    return chain;
  }

  /**
   * Get human-readable provider name
   */
  getProviderDisplayName(providerName) {
    const names = {
      'mivoz': 'MiVoz Native',
      'cartesia': 'Cartesia Sonic',
      'elevenlabs': 'ElevenLabs Turbo'
    };
    return names[providerName] || providerName;
  }

  /**
   * Check health of all providers
   */
  async getHealth() {
    const health = {};

    for (const [name, service] of Object.entries(this.providers)) {
      try {
        const result = await service.healthCheck();
        health[name] = result;
      } catch (error) {
        health[name] = {
          healthy: false,
          message: error.message
        };
      }
    }

    return health;
  }

  /**
   * Get status report
   */
  async getStatus() {
    const health = await this.getHealth();
    const healthyProviders = Object.entries(health)
      .filter(([_, h]) => h.healthy)
      .map(([name, _]) => name);

    return {
      currentProvider: this.provider,
      healthyProviders,
      allProviders: Object.keys(this.providers),
      health
    };
  }
}

module.exports = TTSStreamingService;
