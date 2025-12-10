/**
 * Audio Routes
 * Gestión de audio: TTS (Cartesia) y STT (Transcripción)
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

module.exports = (services) => {
  // TTS - Text to Speech
  router.post('/tts', async (req, res) => {
    try {
      const { text, voiceId } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Texto requerido' });
      }
      
      const audio = await services.cartesia.textToSpeech(text, voiceId);
      
      res.json({
        success: true,
        audio,
        format: 'mp3',
        length: text.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en TTS:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // STT - Speech to Text
  router.post('/stt', async (req, res) => {
    try {
      const audioData = req.body.audio || req.body.data;
      
      if (!audioData) {
        return res.status(400).json({ error: 'Audio requerido' });
      }
      
      const transcript = await services.transcriber.transcribe(audioData);
      
      res.json({
        success: true,
        transcript,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en STT:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Welcome message (saludo inicial de Sandra) - USA ARCHIVO PRE-GRABADO
  router.post('/welcome', async (req, res) => {
    try {
      const { timezone } = req.body;

      // Obtener ambientación según hora
      const ambientation = await services.ambientation.getCurrentAmbientation(timezone);

      // Texto del saludo (para referencia, el audio está pre-grabado)
      const welcomeText = '¡Hola! Soy Sandra. Bienvenido a GuestsValencia. ¿En qué puedo ayudarte hoy?';

      // CRÍTICO: Usar audio PRE-GRABADO en lugar de generar con TTS
      const welcomeAudioPath = path.join(__dirname, '../assets/audio/welcome.mp3');

      if (!fs.existsSync(welcomeAudioPath)) {
        console.error('❌ [AUDIO] Archivo de audio grabado no encontrado:', welcomeAudioPath);
        // Fallback: generar con TTS si el archivo no existe
        console.log('⚠️ [AUDIO] Generando audio con TTS como fallback...');
        const audio = await services.cartesia.textToSpeech(welcomeText);
        return res.json({
          success: true,
          audio,
          text: welcomeText,
          ambientation,
          source: 'tts_fallback',
          timestamp: new Date().toISOString()
        });
      }

      // Leer archivo pre-grabado y convertir a base64
      const audioBuffer = fs.readFileSync(welcomeAudioPath);
      const audio = audioBuffer.toString('base64');

      console.log('✅ [AUDIO] Audio de bienvenida PRE-GRABADO cargado:', {
        tamaño: `${(audioBuffer.length / 1024).toFixed(2)} KB`,
        formato: 'MP3'
      });

      res.json({
        success: true,
        audio,
        text: welcomeText,
        ambientation,
        source: 'pre_recorded',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error cargando saludo:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};

