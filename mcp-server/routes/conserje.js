/**
 * Conserje Routes
 * Rol principal de Sandra IA como Conserje
 * Procesamiento conversacional con contexto completo
 */

const express = require('express');
const router = express.Router();

module.exports = (services) => {
  // Procesar mensaje conversacional
  router.post('/message', async (req, res) => {
    try {
      const { message, context, timezone } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Mensaje requerido' });
      }
      
      // Obtener contexto completo
      const bridgeDataContext = await services.bridgeData.getContext();
      const ambientation = await services.ambientation.getCurrentAmbientation(timezone);
      
      // Procesar con Qwen (rol Conserje)
      const response = await services.qwen.processMessage(message, {
        role: 'conserje',
        context: context || 'Eres Sandra, la conserje virtual de GuestsValencia. Eres amable, profesional y siempre disponible para ayudar.',
        bridgeData: bridgeDataContext,
        ambientation,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        response: response.text,
        model: response.model,
        usage: response.usage,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error procesando mensaje:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Flujo completo de voz (STT -> LLM -> TTS)
  router.post('/voice-flow', async (req, res) => {
    try {
      const { audio, timezone } = req.body;
      
      if (!audio) {
        return res.status(400).json({ error: 'Audio requerido' });
      }
      
      // 1. Transcripción (STT)
      const transcript = await services.transcriber.transcribe(audio);
      
      // 2. Procesamiento con LLM
      const bridgeDataContext = await services.bridgeData.getContext();
      const ambientation = await services.ambientation.getCurrentAmbientation(timezone);
      
      const llmResponse = await services.qwen.processMessage(transcript, {
        role: 'conserje',
        bridgeData: bridgeDataContext,
        ambientation
      });
      
      // 3. Text-to-Speech (TTS)
      const audioResponse = await services.cartesia.textToSpeech(llmResponse.text);
      
      res.json({
        success: true,
        flow: {
          transcript,
          response: llmResponse.text,
          audio: audioResponse
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en flujo de voz:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Obtener contexto completo para conversación
  router.get('/context', async (req, res) => {
    try {
      const timezone = req.query.timezone || 'Europe/Madrid';
      
      const context = {
        bridgeData: await services.bridgeData.getContext(),
        ambientation: await services.ambientation.getCurrentAmbientation(timezone),
        timestamp: new Date().toISOString()
      };
      
      res.json({
        success: true,
        context
      });
    } catch (error) {
      console.error('Error obteniendo contexto:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};

