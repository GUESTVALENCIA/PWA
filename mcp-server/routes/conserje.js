/**
 * Conserje Routes
 * Rol principal de Sandra IA como Conserje
 * Procesamiento conversacional con contexto completo
 */

const express = require('express');
const router = express.Router();
const eventBus = require('../utils/event_bus');

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
      
      // Procesar con IA (rol Conserje)
      const response = await services.qwen.processMessage(message, {
        role: 'conserje',
        context: context || 'Eres Sandra, la conserje virtual de GuestsValencia. Eres amable, profesional y siempre disponible para ayudar.',
        bridgeData: bridgeDataContext,
        ambientation,
        timestamp: new Date().toISOString()
      });

      const responseText = (response && typeof response === 'object') ? response.text : String(response || '');
      const responseModel = (response && typeof response === 'object') ? response.model : (services.qwen?.model || 'unknown');
      const responseUsage = (response && typeof response === 'object') ? response.usage : null;
      
      // Emitir evento de mensaje para subagentes
      eventBus.emit('conserje.message', {
        message,
        response: responseText,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        response: responseText,
        model: responseModel,
        usage: responseUsage,
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
      const { audio, timezone, action } = req.body;
      
      // Manejar acción 'reserve_channel' (cuando el widget reserva canal de voz)
      if (action === 'reserve_channel') {
        return res.json({
          success: true,
          action: 'reserve_channel',
          channel: 'voice_channel_ready',
          message: 'Canal de voz reservado correctamente',
          timestamp: new Date().toISOString()
        });
      }
      
      if (!audio) {
        return res.status(400).json({ error: 'Audio requerido' });
      }
      
      // 1. Transcripción (STT)
      const transcript = await services.transcriber.transcribe(audio);
      
      // Emitir evento de transcripción para subagentes
      eventBus.emit('audio.transcribed', {
        transcript,
        timestamp: new Date().toISOString()
      });
      
      // Emitir evento de flujo de voz
      eventBus.emit('voice.flow', {
        transcript,
        timestamp: new Date().toISOString()
      });
      
      // 2. Procesamiento con LLM
      const bridgeDataContext = await services.bridgeData.getContext();
      const ambientation = await services.ambientation.getCurrentAmbientation(timezone);
      
      const llmResponse = await services.qwen.processMessage(transcript, {
        role: 'conserje',
        bridgeData: bridgeDataContext,
        ambientation
      });

      const llmText = (llmResponse && typeof llmResponse === 'object') ? llmResponse.text : String(llmResponse || '');
      
      // 3. Text-to-Speech (TTS)
      const audioResponse = await services.voice.textToSpeech(llmText);
      
      res.json({
        success: true,
        flow: {
          transcript,
          response: llmText,
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

