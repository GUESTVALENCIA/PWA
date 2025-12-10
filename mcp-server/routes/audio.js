/**
 * Audio Routes
 * Gestión de audio: TTS (Cartesia) y STT (Transcripción)
 */

const express = require('express');
const router = express.Router();

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

  // Welcome message (saludo inicial de Sandra)
  router.post('/welcome', async (req, res) => {
    try {
      const { timezone } = req.body;
      
      // Obtener ambientación según hora
      const ambientation = await services.ambientation.getCurrentAmbientation(timezone);
      
      // Generar saludo contextual
      const welcomeText = `Hola, soy Sandra, bienvenido a GuestsValencia, ¿en qué puedo ayudarte hoy?`;
      
      // Generar audio
      const audio = await services.cartesia.textToSpeech(welcomeText);
      
      res.json({
        success: true,
        audio,
        text: welcomeText,
        ambientation,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generando saludo:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};

