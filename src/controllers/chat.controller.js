const geminiService = require('../services/gemini.service');

const cartesiaService = require('../services/cartesia.service');

const deepgramService = require('../services/deepgram.service');

const config = require('../config/config');



class ChatController {



  async chat(req, res, next) {

    try {

      const { message, conversationHistory = [], sessionId = null } = req.body;

      if (!message) {

        return res.status(400).json({ error: 'Missing message in request body' });

      }

      // 🚀 CHAT CONVERSACIONAL: Usar prompt conversacional con toolHandler
      const voiceServices = req.services?.voiceServices;
      const toolHandler = req.services?.toolHandler;

      if (voiceServices && voiceServices.ai && voiceServices.ai.processMessage) {
        // Usar prompt conversacional completo
        const context = {
          greetingSent: false, // En chat de texto, siempre permitir saludo natural
          conversationHistory: conversationHistory,
          lastFinalizedTranscript: null,
          lastAIResponse: null
        };

        console.log('[CHAT] Usando prompt conversacional con toolHandler');
        const reply = await voiceServices.ai.processMessage(message, context, toolHandler);
        console.log('[CHAT] Respuesta generada:', reply.substring(0, 50) + '...');

        return res.json({ 
          reply,
          model: 'gpt-4o-mini',
          conversationContext: context
        });
      } else {
        // Fallback al prompt básico si voiceServices no está disponible
        console.log('[CHAT] Fallback: usando prompt básico (voiceServices no disponible)');
        const role = 'luxury';
        const fullSystemPrompt = `${config.globalConversationRules}\nRole: ${role}`;
        const reply = await geminiService.generateContent(message, fullSystemPrompt);
        console.log('[CHAT] Respuesta generada (fallback):', reply.substring(0, 50) + '...');
        return res.json({ reply });
      }

    } catch (error) {

      console.error('[CHAT] Error:', error);
      next(error);

    }

  }



  async transcribe(req, res, next) {

    try {

      const { audio } = req.body;

      if (!audio) {

        return res.status(400).json({ error: 'Missing audio in request body' });

      }



      const transcript = await deepgramService.transcribeAudio(audio);

      res.json({ transcript });

    } catch (error) {

      next(error);

    }

  }



  async voice(req, res, next) {

      try {

          const { text, voiceId } = req.body;

          if (!text) {

              return res.status(400).json({ error: 'Missing text in request body' });

          }



          const audioContent = await cartesiaService.generateVoice(text, voiceId);

          res.json({ audioContent });

      } catch (error) {

          next(error);

      }

  }

}



module.exports = new ChatController();

