/**
 * Static Voice Service
 * Sirve la voz pre-grabada de Sandra (sin latencia de API)
 * Reemplaza Cartesia para eliminar latencia
 */

const fs = require('fs');
const path = require('path');

class StaticVoiceService {
  constructor() {
    this.ready = false;
    this.voiceFile = path.join(__dirname, '../../assets/audio/sandra-voice.mp3');
    this.voiceBuffer = null;
    this.initialize();
  }

  async initialize() {
    try {
      // Pre-cargar el archivo de voz en memoria (28KB = negligible)
      this.voiceBuffer = fs.readFileSync(this.voiceFile);
      this.ready = true;
      console.log(`[VOICE-STATIC] ✅ Voz Sandra cargada en memoria: ${this.voiceBuffer.length} bytes`);
    } catch (error) {
      console.error(`[VOICE-STATIC] ❌ Error cargando archivo de voz:`, error.message);
      this.ready = false;
    }
  }

  isReady() {
    return this.ready && this.voiceBuffer !== null;
  }

  getStatus() {
    return {
      ready: this.ready,
      type: 'static',
      voiceSize: this.voiceBuffer ? this.voiceBuffer.length : 0,
      voiceFile: this.voiceFile
    };
  }

  /**
   * Retorna la voz pre-grabada como base64 (instant, sin latencia)
   * @param {string} text - Ignorado (usamos voz fija)
   * @returns {string} Base64 encoded MP3
   */
  async textToSpeech(text, voiceId = null) {
    if (!this.ready) {
      throw new Error('Static Voice Service no está listo. Voz no cargada.');
    }

    if (!this.voiceBuffer || this.voiceBuffer.length === 0) {
      throw new Error('Voice buffer es vacío');
    }

    console.log(`[VOICE-STATIC] 🎤 Sirviendo voz Sandra (${this.voiceBuffer.length} bytes)`);

    // Retornar como base64 (mismo formato que Cartesia)
    return this.voiceBuffer.toString('base64');
  }

  /**
   * Obtener URL de la voz para descargas directo (si se necesita)
   */
  getVoiceUrl() {
    return '/assets/audio/sandra-voice.mp3';
  }
}

module.exports = StaticVoiceService;
