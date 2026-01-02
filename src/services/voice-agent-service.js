/**
 * Deepgram Voice Agent API Service
 * Integrated STT + LLM (OpenAI GPT-4o-mini) + TTS pipeline for minimal latency
 * 
 * Voice Agent API handles the entire pipeline:
 * - Listen (STT) → Think (LLM) → Speak (TTS)
 * - All in one WebSocket connection
 * - Native barge-in support
 * - Optimized for enterprise call quality
 */

import { createClient, AgentEvents } from '@deepgram/sdk';
import logger from '../utils/logger.js';

class VoiceAgentService {
  constructor() {
    this.deepgramApiKey = process.env.DEEPGRAM_API_KEY;
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!this.deepgramApiKey) {
      logger.warn('[VOICE-AGENT] ⚠️ Deepgram API Key not configured');
      this.deepgram = null;
      return;
    }

    if (!this.openaiApiKey) {
      logger.warn('[VOICE-AGENT] ⚠️ OpenAI API Key not configured (required for Voice Agent)');
      this.deepgram = null;
      return;
    }

    try {
      this.deepgram = createClient(this.deepgramApiKey);
      logger.info('[VOICE-AGENT] ✅ Deepgram SDK initialized for Voice Agent API');
      logger.info('[VOICE-AGENT] ✅ OpenAI API Key configured (for GPT-4o-mini)');
    } catch (error) {
      logger.error('[VOICE-AGENT] ❌ Failed to initialize Deepgram SDK:', error);
      this.deepgram = null;
    }
  }

  /**
   * Create Voice Agent connection
   * @param {Object} options - Configuration options with event handlers
   * @returns {Object} Voice Agent connection object
   */
  createAgentConnection(options = {}) {
    if (!this.deepgram) {
      throw new Error('Deepgram SDK not initialized - check DEEPGRAM_API_KEY');
    }

    if (!this.openaiApiKey) {
      throw new Error('OpenAI API Key not configured - required for Voice Agent');
    }

    const {
      onUserStartedSpeaking = null,
      onAgentThinking = null,
      onAgentStartedSpeaking = null,
      onConversationText = null,
      onAudio = null,
      onError = null,
      onClose = null
    } = options;

    logger.info('[VOICE-AGENT] 🔌 Creating Voice Agent connection...');

    // Create Voice Agent connection using Deepgram SDK
    const agent = this.deepgram.agent();

    // Configure agent when Welcome event is received
    agent.on(AgentEvents.Welcome, () => {
      logger.info('[VOICE-AGENT] ✅ Connected to Voice Agent API');
      
      // Send Settings message to configure the agent
      // GPT-4o-mini as preferred model (user requirement)
      agent.send({
        type: 'Settings',
        agent: {
          listen: {
            provider: {
              type: 'deepgram',
              model: 'nova-2-phonecall' // Optimized for phone calls
            }
          },
          think: {
            provider: {
              type: 'open_ai',
              model: 'gpt-4o-mini' // Preferred: GPT-4o-mini (user requirement)
            },
            prompt: `Eres Sandra, la asistente virtual de Guests Valencia, especializada en hospitalidad y turismo.
Responde SIEMPRE en español neutro, con buena ortografía y gramática.
Actúa como una experta en Hospitalidad y Turismo.
Sé breve: máximo 4 frases salvo que se pida detalle.
Sé amable, profesional y útil.`
          },
          speak: {
            provider: {
              type: 'deepgram',
              model: 'aura-2-agustina-es' // Spanish Peninsular female voice (Agustina)
            }
          },
          language: 'es',
          greeting: 'Hola, buenas, soy Sandra, tu asistente de Guests Valencia, ¿en qué puedo ayudarte hoy?'
        }
      });

      logger.info('[VOICE-AGENT] ✅ Settings sent (GPT-4o-mini, voz Agustina, modelo nova-2-phonecall)');
    });

    // Handle user started speaking (for barge-in detection)
    if (onUserStartedSpeaking) {
      agent.on(AgentEvents.UserStartedSpeaking, (data) => {
        logger.debug('[VOICE-AGENT] 👤 User started speaking');
        onUserStartedSpeaking(data);
      });
    }

    // Handle agent thinking (LLM processing)
    if (onAgentThinking) {
      agent.on(AgentEvents.AgentThinking, (data) => {
        logger.debug('[VOICE-AGENT] 🤔 Agent thinking (LLM processing)');
        onAgentThinking(data);
      });
    }

    // Handle agent started speaking (TTS started)
    if (onAgentStartedSpeaking) {
      agent.on(AgentEvents.AgentStartedSpeaking, (data) => {
        logger.info('[VOICE-AGENT] 🗣️ Agent started speaking (TTS audio started)');
        onAgentStartedSpeaking(data);
      });
    }

    // Handle conversation text (transcriptions and responses)
    if (onConversationText) {
      agent.on(AgentEvents.ConversationText, (data) => {
        const text = data?.text || '';
        if (text) {
          logger.debug(`[VOICE-AGENT] 💬 Conversation text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
          onConversationText(data);
        }
      });
    }

    // Handle audio (TTS output - PCM audio chunks)
    if (onAudio) {
      agent.on(AgentEvents.Audio, (audio) => {
        logger.debug('[VOICE-AGENT] 🔊 Audio chunk received (PCM)');
        onAudio(audio);
      });
    }

    // Handle errors
    agent.on(AgentEvents.Error, (error) => {
      logger.error('[VOICE-AGENT] ❌ Error:', error);
      if (onError) {
        onError(error);
      }
    });

    // Handle close
    if (onClose) {
      agent.on(AgentEvents.Close, () => {
        logger.info('[VOICE-AGENT] 🔌 Connection closed');
        onClose();
      });
    }

    return agent;
  }

  /**
   * Check if Voice Agent API is available and configured
   * @returns {boolean} True if both Deepgram and OpenAI API keys are configured
   */
  isConfigured() {
    return !!(this.deepgram && this.openaiApiKey);
  }
}

export default VoiceAgentService;
