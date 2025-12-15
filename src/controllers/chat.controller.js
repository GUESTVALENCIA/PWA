const geminiService = require('../services/gemini.service');
const cartesiaService = require('../services/cartesia.service');
const deepgramService = require('../services/deepgram.service');
const config = require('../config/config');

class ChatController {

  async chat(req, res, next) {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Missing message in request body' });
      }

      const role = 'luxury'; // Default role
      const fullSystemPrompt = `${config.globalConversationRules}\nRole: ${role}`;

      console.log('📨 Message received:', message);
      const reply = await geminiService.generateContent(message, fullSystemPrompt);
      console.log('✅ Response generated:', reply.substring(0, 50) + '...');

      res.json({ reply });
    } catch (error) {
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
