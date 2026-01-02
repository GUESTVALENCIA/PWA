/**
 * Voice Library Manager
 * Manages native voice playback from local audio files
 * Supports Cartesia and other voice providers
 */

class VoiceLibraryManager {
  constructor() {
    this.voiceConfig = null;
    this.currentAudio = null;
    this.audioQueue = [];
    this.isPlaying = false;
    this.initialized = false;

    this.init();
  }

  async init() {
    try {
      const response = await fetch('/assets/config/voice-library.json');
      if (!response.ok) throw new Error('Failed to load voice library config');
      this.voiceConfig = await response.json();
      this.initialized = true;
      console.log('[VOICE-LIBRARY] ✅ Voice library initialized:', this.voiceConfig);
    } catch (error) {
      console.error('[VOICE-LIBRARY] ❌ Failed to initialize voice library:', error);
      this.voiceConfig = this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      voiceLibrary: {
        default: {
          file: '/assets/audio/sandra-voice.mp3',
          name: 'Sandra Native',
          language: 'es',
          provider: 'native'
        }
      },
      responseTypeMapping: {
        default: 'default'
      },
      voiceSettings: {
        volume: 1.0,
        playbackRate: 1.0,
        maxConcurrentAudio: 1
      },
      fallbackChain: ['default']
    };
  }

  /**
   * Select appropriate voice based on response type
   */
  selectVoice(responseType = 'general') {
    if (!this.voiceConfig) {
      console.warn('[VOICE-LIBRARY] Config not loaded, using default');
      return this.voiceConfig?.voiceLibrary?.default || null;
    }

    const mapping = this.voiceConfig.responseTypeMapping;
    const voiceKey = mapping[responseType] || mapping['default'];
    const voice = this.voiceConfig.voiceLibrary[voiceKey];

    if (voice) {
      console.log(`[VOICE-LIBRARY] Selected voice for type "${responseType}":`, voice.name);
      return voice;
    }

    console.warn(`[VOICE-LIBRARY] Voice "${voiceKey}" not found, trying fallback chain`);
    return this.getFallbackVoice();
  }

  /**
   * Get fallback voice from fallback chain
   */
  getFallbackVoice() {
    const fallbackChain = this.voiceConfig?.fallbackChain || ['default'];
    for (const key of fallbackChain) {
      const voice = this.voiceConfig.voiceLibrary[key];
      if (voice) {
        console.log('[VOICE-LIBRARY] Using fallback voice:', voice.name);
        return voice;
      }
    }
    return this.voiceConfig?.voiceLibrary?.default || null;
  }

  /**
   * Check if voice file exists
   */
  async voiceExists(voiceFilePath) {
    try {
      const response = await fetch(voiceFilePath, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.warn(`[VOICE-LIBRARY] Voice file check failed for ${voiceFilePath}:`, error);
      return false;
    }
  }

  /**
   * Play voice for response
   */
  async playVoice(responseType = 'general', responseText = '') {
    if (!this.initialized) {
      console.warn('[VOICE-LIBRARY] Voice library not initialized, initializing...');
      await this.init();
    }

    const voice = this.selectVoice(responseType);
    if (!voice) {
      console.error('[VOICE-LIBRARY] ❌ No voice available');
      return false;
    }

    const settings = this.voiceConfig?.voiceSettings || {};

    // Check if file exists
    const exists = await this.voiceExists(voice.file);
    if (!exists) {
      console.warn(`[VOICE-LIBRARY] Voice file not found: ${voice.file}`);
      const fallback = this.getFallbackVoice();
      if (fallback && fallback !== voice) {
        console.log('[VOICE-LIBRARY] Trying fallback voice');
        return this.playAudio(fallback.file, settings);
      }
      return false;
    }

    return this.playAudio(voice.file, settings);
  }

  /**
   * Play audio file
   */
  async playAudio(filePath, settings = {}) {
    try {
      const volume = settings.volume || 1.0;
      const playbackRate = settings.playbackRate || 1.0;

      // Stop current playback if playing
      if (this.isPlaying && this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      }

      const audio = new Audio(filePath);
      audio.volume = volume;
      audio.playbackRate = playbackRate;
      audio.crossOrigin = 'anonymous';

      this.currentAudio = audio;
      this.isPlaying = true;

      console.log(`[VOICE-LIBRARY] 🔊 Playing voice: ${filePath} (Vol: ${volume}, Speed: ${playbackRate}x)`);

      return new Promise((resolve) => {
        audio.onended = () => {
          this.isPlaying = false;
          console.log('[VOICE-LIBRARY] ✅ Voice playback finished');
          resolve(true);
        };

        audio.onerror = (error) => {
          this.isPlaying = false;
          console.error('[VOICE-LIBRARY] ❌ Audio playback error:', error);
          resolve(false);
        };

        audio.onloadstart = () => {
          console.log('[VOICE-LIBRARY] Loading audio...');
        };

        audio.onplay = () => {
          console.log('[VOICE-LIBRARY] Audio playing...');
        };

        audio.play().catch((error) => {
          this.isPlaying = false;
          console.error('[VOICE-LIBRARY] ❌ Failed to play audio:', error);
          resolve(false);
        });
      });
    } catch (error) {
      console.error('[VOICE-LIBRARY] ❌ Error in playAudio:', error);
      this.isPlaying = false;
      return false;
    }
  }

  /**
   * Stop current playback
   */
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.isPlaying = false;
      console.log('[VOICE-LIBRARY] ⏹️  Playback stopped');
    }
  }

  /**
   * Get available voices
   */
  getAvailableVoices() {
    if (!this.voiceConfig) return [];
    return Object.entries(this.voiceConfig.voiceLibrary).map(([key, voice]) => ({
      key,
      ...voice
    }));
  }

  /**
   * Get voice library configuration
   */
  getConfig() {
    return this.voiceConfig;
  }

  /**
   * Update voice configuration
   */
  setVoiceForType(responseType, voiceKey) {
    if (!this.voiceConfig) return false;
    this.voiceConfig.responseTypeMapping[responseType] = voiceKey;
    console.log(`[VOICE-LIBRARY] Updated mapping: ${responseType} -> ${voiceKey}`);
    return true;
  }
}

// Initialize globally
if (typeof window !== 'undefined') {
  window.voiceLibraryManager = null;

  document.addEventListener('DOMContentLoaded', async () => {
    window.voiceLibraryManager = new VoiceLibraryManager();
    console.log('[VOICE-LIBRARY] Global voice manager initialized');
  });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceLibraryManager;
}
