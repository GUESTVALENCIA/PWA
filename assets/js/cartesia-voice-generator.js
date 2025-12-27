/**
 * Cartesia Voice Generator Utility
 * Helper utility for generating and managing Cartesia TTS voices
 *
 * This utility helps pre-generate voice files from Cartesia API
 * and manage them in the voice library system
 */

class CartesiaVoiceGenerator {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.cartesiaApiUrl = 'https://api.cartesia.ai/tts/stream';
    this.baseAudioPath = '/assets/audio';
    this.voiceLibraryPath = '/assets/config/voice-library.json';
    this.log = this.createLogger();
  }

  createLogger() {
    return {
      info: (msg) => console.log(`[CARTESIA-GENERATOR] ℹ️  ${msg}`),
      success: (msg) => console.log(`[CARTESIA-GENERATOR] ✅ ${msg}`),
      warn: (msg) => console.warn(`[CARTESIA-GENERATOR] ⚠️  ${msg}`),
      error: (msg) => console.error(`[CARTESIA-GENERATOR] ❌ ${msg}`),
    };
  }

  /**
   * Generate voice file from Cartesia API
   *
   * @param {string} text - Text to convert to speech
   * @param {string} voiceId - Cartesia voice ID
   * @param {string} filename - Output filename (without path)
   * @param {object} options - Additional options
   * @returns {Promise<Blob>} Audio blob
   */
  async generateVoice(text, voiceId, filename, options = {}) {
    const {
      model = 'sonic-english',
      language = 'es',
      duration = 15.0,
      sampleRate = 24000
    } = options;

    if (!this.apiKey) {
      this.log.error('Cartesia API key not provided');
      return null;
    }

    if (!text || !voiceId || !filename) {
      this.log.error('Missing required parameters: text, voiceId, filename');
      return null;
    }

    try {
      this.log.info(`Generating voice: ${filename} for text: "${text.substring(0, 50)}..."`);

      const requestBody = {
        model_id: model,
        voice: {
          mode: 'id',
          id: voiceId
        },
        transcript: text,
        duration: duration,
        language: language,
        output_format: {
          container: 'mp3',
          encoding: 'mp3',
          sample_rate: sampleRate
        }
      };

      const response = await fetch(this.cartesiaApiUrl, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.text();
        this.log.error(`API error: ${response.status} - ${error}`);
        return null;
      }

      const blob = await response.blob();
      this.log.success(`Generated ${filename} (${(blob.size / 1024).toFixed(2)} KB)`);

      return blob;
    } catch (error) {
      this.log.error(`Failed to generate voice: ${error.message}`);
      return null;
    }
  }

  /**
   * Download blob as file (for browser environment)
   *
   * @param {Blob} blob - Blob to download
   * @param {string} filename - Filename to save as
   */
  downloadBlob(blob, filename) {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      this.log.success(`Downloaded: ${filename}`);
    } catch (error) {
      this.log.error(`Failed to download: ${error.message}`);
    }
  }

  /**
   * Get common Sandra response templates
   *
   * @returns {Array} Array of response templates
   */
  getCommonResponseTemplates() {
    return [
      {
        type: 'welcome',
        text: 'Bienvenido a Guests Valencia. Soy Sandra, tu asistente virtual. Estoy aquí para ayudarte con todo lo que necesites durante tu estancia.',
        voiceId: 'friendly-casual',
        filename: 'cartesia-welcome.mp3'
      },
      {
        type: 'hospitality-professional',
        text: 'Gracias por elegir Guests Valencia. Te he reservado el alojamiento perfecto. Si necesitas ayuda con check-in o tienes alguna pregunta, no dudes en preguntar.',
        voiceId: 'professional-hospitality',
        filename: 'cartesia-professional.mp3'
      },
      {
        type: 'luxury-greeting',
        text: 'Bienvenido a nuestra suite de lujo. Has seleccionado nuestro alojamiento más exclusivo. Todos nuestros servicios premium están a tu disposición.',
        voiceId: 'luxury-premium',
        filename: 'cartesia-luxury.mp3'
      },
      {
        type: 'check-in',
        text: 'Aquí están las instrucciones para tu check-in. Puedes acceder a tu alojamiento mediante el código de acceso que te hemos enviado. El código es válido desde las tres de la tarde.',
        voiceId: 'professional-hospitality',
        filename: 'cartesia-checkin.mp3'
      },
      {
        type: 'facilities',
        text: 'Los servicios incluyen WiFi de alta velocidad, aire acondicionado, Smart TV, cocina completa y todo lo necesario para una estancia cómoda.',
        voiceId: 'friendly-casual',
        filename: 'cartesia-facilities.mp3'
      },
      {
        type: 'emergency',
        text: 'En caso de emergencia, puedes contactarme inmediatamente o llamar al número que aparece en la pared. Estoy disponible veinticuatro horas al día.',
        voiceId: 'professional-hospitality',
        filename: 'cartesia-emergency.mp3'
      },
      {
        type: 'checkout',
        text: 'Tu check-out es a las once de la mañana. Por favor, asegúrate de que todo está en orden antes de irte. Gracias por tu estancia.',
        voiceId: 'friendly-casual',
        filename: 'cartesia-checkout.mp3'
      },
      {
        type: 'support',
        text: 'Tienes un problema técnico. No te preocupes, voy a ayudarte a solucionarlo de inmediato. Cuéntame qué está sucediendo.',
        voiceId: 'friendly-casual',
        filename: 'cartesia-support.mp3'
      }
    ];
  }

  /**
   * Generate multiple voices at once
   *
   * @param {Array} templates - Array of template objects
   * @returns {Promise<Object>} Generated voices map
   */
  async generateMultipleVoices(templates) {
    const results = {};

    for (const template of templates) {
      this.log.info(`Generating: ${template.type} (${template.filename})`);
      const blob = await this.generateVoice(
        template.text,
        template.voiceId,
        template.filename
      );

      if (blob) {
        results[template.type] = {
          blob: blob,
          filename: template.filename,
          type: template.type,
          voiceId: template.voiceId
        };
      }

      // Rate limiting to respect API limits
      await this.delay(2000);
    }

    return results;
  }

  /**
   * Utility: delay execution
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get voice configuration for update
   *
   * @param {string} voiceKey - Unique voice key
   * @param {string} filename - Audio file path
   * @param {object} metadata - Voice metadata
   * @returns {Object} Voice configuration object
   */
  getVoiceConfig(voiceKey, filename, metadata = {}) {
    return {
      file: `/assets/audio/${filename}`,
      name: metadata.name || `Sandra ${voiceKey}`,
      language: metadata.language || 'es',
      provider: 'cartesia',
      description: metadata.description || 'Cartesia-generated voice',
      generated: true,
      model: metadata.model || 'sonic-english',
      voice_id: metadata.voiceId || voiceKey,
      generated_date: new Date().toISOString()
    };
  }

  /**
   * Generate voice library update configuration
   *
   * @param {Object} generatedVoices - Map of generated voices
   * @returns {Object} Voice library update configuration
   */
  generateLibraryUpdate(generatedVoices) {
    const update = {
      voiceLibrary: {},
      responseTypeMapping: {}
    };

    for (const [key, voice] of Object.entries(generatedVoices)) {
      update.voiceLibrary[`cartesia-${key}`] = this.getVoiceConfig(
        key,
        voice.filename,
        { voiceId: voice.voiceId }
      );

      // Auto-map response types
      if (key.includes('welcome')) {
        update.responseTypeMapping['greeting'] = `cartesia-${key}`;
      } else if (key.includes('luxury')) {
        update.responseTypeMapping['luxury'] = `cartesia-${key}`;
      } else if (key.includes('professional')) {
        update.responseTypeMapping['hospitality'] = `cartesia-${key}`;
      } else if (key.includes('support')) {
        update.responseTypeMapping['support'] = `cartesia-${key}`;
      }
    }

    return update;
  }

  /**
   * Log usage instructions
   */
  printInstructions() {
    const instructions = `
╔════════════════════════════════════════════════════════════════╗
║           Cartesia Voice Generator Instructions               ║
╚════════════════════════════════════════════════════════════════╝

1. INITIALIZE WITH API KEY:
   const generator = new CartesiaVoiceGenerator('YOUR_API_KEY');

2. GENERATE SINGLE VOICE:
   const blob = await generator.generateVoice(
     'Hola, ¿cómo estás?',
     'voice-id-here',
     'custom-voice.mp3'
   );
   generator.downloadBlob(blob, 'custom-voice.mp3');

3. GENERATE COMMON RESPONSES:
   const templates = generator.getCommonResponseTemplates();
   const voices = await generator.generateMultipleVoices(templates);
   // Then download each voice manually

4. GET LIBRARY CONFIG UPDATE:
   const update = generator.generateLibraryUpdate(voices);
   console.log(JSON.stringify(update, null, 2));
   // Copy this and update /assets/config/voice-library.json

5. AVAILABLE CARTESIA VOICE IDs:
   - friendly-casual
   - professional-hospitality
   - luxury-premium
   - (Add custom voice IDs from Cartesia dashboard)

NOTES:
- Rate limit: 2 seconds between requests
- Each voice generation is ~2-5 seconds
- Downloaded files go to browser Downloads folder
- Upload to /assets/audio/ via FTP or file manager
- Update voice-library.json with generated voice configs
    `;
    console.log(instructions);
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CartesiaVoiceGenerator;
}

// Initialize globally for browser console access
if (typeof window !== 'undefined') {
  window.CartesiaVoiceGenerator = CartesiaVoiceGenerator;
  console.log('[CARTESIA-GENERATOR] ℹ️  CartesiaVoiceGenerator loaded. Use: new CartesiaVoiceGenerator(API_KEY)');
}
