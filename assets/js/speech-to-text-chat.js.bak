/**
 * Speech-to-Text Chat System - FASE 2 con DEEPGRAM
 *
 * Maneja:
 * 1. Captura de audio con MediaRecorder
 * 2. Envío a Deepgram STT (vía chat-text.js)
 * 3. Procesamiento con gpt-4o-mini
 * 4. Reproducción con voz de Sandra
 *
 * NO usa Realtime API - Es conversación pura por texto
 */

class SpeechToChatSystem {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isListening = false;
    this.conversationHistory = [];
    this.language = 'es';
    this.apiEndpoint = '/api/sandra/chat-text';

    this.log = {
      info: (msg) => console.log(`[SPEECH-CHAT] ℹ️  ${msg}`),
      success: (msg) => console.log(`[SPEECH-CHAT] ✅ ${msg}`),
      warn: (msg) => console.warn(`[SPEECH-CHAT] ⚠️  ${msg}`),
      error: (msg) => console.error(`[SPEECH-CHAT] ❌ ${msg}`)
    };

    this.initAudioCapture();
    this.log.success('Speech-to-Text Chat System con Deepgram inicializado');
  }

  /**
   * Inicializar captura de audio con MediaRecorder
   */
  async initAudioCapture() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioChunks = [];
        await this.processAudioWithDeepgram(audioBlob);
      };

      this.log.success('MediaRecorder inicializado');
    } catch (error) {
      this.log.error(`Error inicializando audio: ${error.message}`);
    }
  }

  /**
   * Iniciar captura de voz
   */
  startListening() {
    if (!this.mediaRecorder) {
      this.log.error('MediaRecorder no disponible');
      return false;
    }

    if (this.isListening) {
      this.log.warn('Ya está escuchando');
      return false;
    }

    try {
      this.audioChunks = [];
      this.mediaRecorder.start();
      this.isListening = true;
      this.log.info('Capturando audio...');
      document.body.classList.add('listening');
      return true;
    } catch (error) {
      this.log.error(`Error iniciando captura: ${error.message}`);
      return false;
    }
  }

  /**
   * Detener captura de voz
   */
  stopListening() {
    if (this.mediaRecorder && this.isListening) {
      this.mediaRecorder.stop();
      this.isListening = false;
      document.body.classList.remove('listening');
      this.log.info('Captura detenida, procesando con Deepgram...');
    }
  }

  /**
   * Procesar audio con Deepgram (vía backend)
   */
  async processAudioWithDeepgram(audioBlob) {
    try {
      // Convertir Blob a base64
      const reader = new FileReader();
      reader.readAsArrayBuffer(audioBlob);

      reader.onload = async () => {
        const audioBuffer = reader.result;
        const audioBase64 = this.arrayBufferToBase64(audioBuffer);

        this.log.info('Enviando audio a Deepgram...');

        // Enviar a chat-text.js que procesará con Deepgram
        const response = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            audioData: audioBase64,
            language: this.language,
            conversationHistory: this.conversationHistory
          })
        });

        if (!response.ok) {
          const error = await response.json();
          this.log.error(`Error API: ${error.error}`);
          return;
        }

        const data = await response.json();
        const userText = data.userText;
        const assistantMessage = data.assistantMessage;
        const responseType = data.responseType;

        this.log.success(`Usuario: "${userText}"`);
        this.log.success(`Respuesta: "${assistantMessage}"`);

        // Agregar al historial
        this.conversationHistory.push({
          role: 'user',
          content: userText
        });

        this.conversationHistory.push({
          role: 'assistant',
          content: assistantMessage
        });

        // Limitar historial
        if (this.conversationHistory.length > 20) {
          this.conversationHistory = this.conversationHistory.slice(-20);
        }

        // Reproducir respuesta con voz de Sandra
        await this.playResponse(assistantMessage, responseType);

      };

    } catch (error) {
      this.log.error(`Error procesando audio: ${error.message}`);
    }
  }

  /**
   * Convertir ArrayBuffer a base64
   */
  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Procesar entrada del usuario
   */
  async handleUserInput(userText) {
    if (!userText || userText.trim().length === 0) {
      this.log.warn('Texto vacío recibido');
      return;
    }

    this.log.info(`Procesando: "${userText}"`);

    // Mostrar que está procesando
    document.body.classList.add('processing');

    try {
      // Enviar a chat-text.js
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userText: userText.trim(),
          language: this.language,
          conversationHistory: this.conversationHistory
        })
      });

      if (!response.ok) {
        const error = await response.json();
        this.log.error(`Error API: ${error.error}`);
        return;
      }

      const data = await response.json();
      const assistantMessage = data.assistantMessage;
      const responseType = data.responseType;

      this.log.success(`Respuesta recibida: "${assistantMessage}"`);

      // Agregar al historial conversacional
      this.conversationHistory.push({
        role: 'user',
        content: userText
      });

      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      });

      // Limitar historial a últimas 10 mensajes (para no crecer indefinidamente)
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      // Reproducir respuesta con voz de Sandra
      await this.playResponse(assistantMessage, responseType);

    } catch (error) {
      this.log.error(`Error procesando entrada: ${error.message}`);
    } finally {
      document.body.classList.remove('processing');
    }
  }

  /**
   * Reproducir respuesta con voz de Sandra
   */
  async playResponse(text, responseType = 'general') {
    this.log.info(`Reproduciendo respuesta tipo: ${responseType}`);

    // Usar el sistema de voz nativa de Sandra si está disponible
    if (window.voiceLibraryManager && window.voiceLibraryManager.playVoice) {
      try {
        const result = await window.voiceLibraryManager.playVoice(responseType, text);
        this.log.success('Respuesta reproducida con voz de Sandra');
        return;
      } catch (error) {
        this.log.warn(`Error con voice library: ${error.message}`);
      }
    }

    // Fallback: usar playFallback si está disponible
    if (typeof playFallback === 'function') {
      try {
        await playFallback(text);
        this.log.success('Respuesta reproducida con playFallback');
        return;
      } catch (error) {
        this.log.warn(`Error con playFallback: ${error.message}`);
      }
    }

    this.log.error('No hay sistema de voz disponible');
  }

  /**
   * Cambiar idioma
   */
  setLanguage(lang) {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
    this.log.info(`Idioma cambiado a: ${lang}`);
  }

  /**
   * Limpiar historial conversacional
   */
  clearHistory() {
    this.conversationHistory = [];
    this.log.info('Historial conversacional limpiado');
  }

  /**
   * Obtener historial
   */
  getHistory() {
    return this.conversationHistory;
  }

  /**
   * Estado del sistema
   */
  getStatus() {
    return {
      isListening: this.isListening,
      language: this.language,
      historyLength: this.conversationHistory.length,
      supportedLanguages: ['es', 'en', 'fr']
    };
  }
}

// Inicializar globalmente
if (typeof window !== 'undefined') {
  window.speechToChatSystem = new SpeechToChatSystem();
  console.log('[SPEECH-CHAT] Sistema inicializado. Usar: window.speechToChatSystem.startListening()');
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpeechToChatSystem;
}
