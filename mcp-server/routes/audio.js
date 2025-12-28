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
      
      const audio = await services.voice.textToSpeech(text, voiceId);
      
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
      const fs = require('fs');
      const path = require('path');
      
      // Obtener ambientación según hora
      const ambientation = await services.ambientation.getCurrentAmbientation(timezone);
      
      // CRÍTICO: Usar archivo pre-grabado, NO generar con TTS
      const welcomeAudioPath = path.join(__dirname, '../assets/audio/welcome.mp3');
      const welcomeText = '¡Hola! Soy Sandra. Bienvenido a GuestsValencia. ¿En qué puedo ayudarte hoy?';
      
      if (!fs.existsSync(welcomeAudioPath)) {
        console.error(' [AUDIO] Archivo de audio grabado no encontrado:', welcomeAudioPath);
        throw new Error('Archivo de audio de bienvenida no encontrado');
      }
      
      // Leer archivo y convertir a base64
      const welcomeAudioBuffer = fs.readFileSync(welcomeAudioPath);
      const audio = welcomeAudioBuffer.toString('base64');
      
      console.log(' [AUDIO] Saludo grabado cargado:', {
        tamaño: `${(welcomeAudioBuffer.length / 1024).toFixed(2)} KB`,
        formato: 'MP3, 44.1kHz'
      });
      
      res.json({
        success: true,
        audio,
        text: welcomeText,
        format: 'mp3',
        ambientation,
        isWelcome: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(' [AUDIO] Error cargando saludo grabado:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};

