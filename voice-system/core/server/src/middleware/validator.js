/**
 * Input Validation Middleware
 * Validates audio data, text, and configuration messages
 *
 * Rules:
 * - Audio: Must be Buffer or ArrayBuffer, size 256 bytes to 1MB
 * - Text: Must be string, 1-5000 characters
 * - Config: Must be valid JSON with allowed message types
 */

const { logger } = require('../utils/logger');

const AUDIO_MIN_SIZE = 256;      // 256 bytes minimum
const AUDIO_MAX_SIZE = 1024 * 1024; // 1MB maximum
const TEXT_MIN_LENGTH = 1;
const TEXT_MAX_LENGTH = 5000;

const ALLOWED_MESSAGE_TYPES = [
  'setLanguage',
  'setProvider',
  'reset',
  'ping'
];

const ALLOWED_LANGUAGES = [
  'es', 'en', 'fr', 'de', 'it', 'pt',
  'ja', 'zh', 'ko', 'ar', 'hi'
];

const ALLOWED_PROVIDERS = [
  'gemini', 'claude', 'openai',
  'mivoz', 'cartesia', 'elevenlabs'
];

/**
 * Validate audio data
 */
function validateAudio(data) {
  // Check type
  if (!(data instanceof Buffer) && !(data instanceof ArrayBuffer)) {
    return {
      valid: false,
      reason: 'Audio must be Buffer or ArrayBuffer'
    };
  }

  // Check size
  const size = data instanceof Buffer ? data.length : data.byteLength;

  if (size < AUDIO_MIN_SIZE) {
    return {
      valid: false,
      reason: `Audio too small (min: ${AUDIO_MIN_SIZE} bytes, got: ${size})`
    };
  }

  if (size > AUDIO_MAX_SIZE) {
    return {
      valid: false,
      reason: `Audio too large (max: ${AUDIO_MAX_SIZE} bytes, got: ${size})`
    };
  }

  return { valid: true };
}

/**
 * Validate text data
 */
function validateText(text) {
  if (typeof text !== 'string') {
    return {
      valid: false,
      reason: 'Text must be a string'
    };
  }

  const length = text.length;

  if (length < TEXT_MIN_LENGTH) {
    return {
      valid: false,
      reason: `Text too short (min: ${TEXT_MIN_LENGTH} char)`
    };
  }

  if (length > TEXT_MAX_LENGTH) {
    return {
      valid: false,
      reason: `Text too long (max: ${TEXT_MAX_LENGTH} chars, got: ${length})`
    };
  }

  return { valid: true };
}

/**
 * Validate configuration message
 */
function validateConfig(msg) {
  if (typeof msg !== 'object' || msg === null) {
    return {
      valid: false,
      reason: 'Message must be a JSON object'
    };
  }

  if (!msg.type) {
    return {
      valid: false,
      reason: 'Message must have a "type" field'
    };
  }

  if (!ALLOWED_MESSAGE_TYPES.includes(msg.type)) {
    return {
      valid: false,
      reason: `Unknown message type: ${msg.type}. Allowed: ${ALLOWED_MESSAGE_TYPES.join(', ')}`
    };
  }

  // Validate specific message types
  switch (msg.type) {
    case 'setLanguage':
      if (!msg.language || typeof msg.language !== 'string') {
        return {
          valid: false,
          reason: 'setLanguage requires "language" field (string)'
        };
      }

      if (!ALLOWED_LANGUAGES.includes(msg.language)) {
        return {
          valid: false,
          reason: `Unknown language: ${msg.language}. Allowed: ${ALLOWED_LANGUAGES.join(', ')}`
        };
      }
      break;

    case 'setProvider':
      if (!msg.provider || typeof msg.provider !== 'string') {
        return {
          valid: false,
          reason: 'setProvider requires "provider" field (string)'
        };
      }

      if (!ALLOWED_PROVIDERS.includes(msg.provider)) {
        return {
          valid: false,
          reason: `Unknown provider: ${msg.provider}. Allowed: ${ALLOWED_PROVIDERS.join(', ')}`
        };
      }
      break;

    // reset and ping don't need extra validation
  }

  return { valid: true };
}

module.exports = {
  validateInput: {
    audio: validateAudio,
    text: validateText,
    config: validateConfig
  },
  AUDIO_MIN_SIZE,
  AUDIO_MAX_SIZE,
  TEXT_MIN_LENGTH,
  TEXT_MAX_LENGTH
};
