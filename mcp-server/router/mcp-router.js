/**
 * MCP Router - Gateway de control principal
 * Rutea peticiones REST a los servicios MCP correspondientes
 */

const express = require('express');

class MCPRouter {
  constructor(services) {
    this.router = express.Router();
    this.services = services;
    this.setupRoutes();
  }

  setupRoutes() {
    // Chat Service
    this.router.post('/chat', async (req, res) => {
      try {
        const { message, context, model } = req.body;
        const response = await this.services.chatService.processMessage(message, { context, model });
        res.json(response);
      } catch (error) {
        console.error('Error en /chat:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Voice Service
    this.router.post('/voice/tts', async (req, res) => {
      try {
        const { text, voiceId } = req.body;
        const audio = await this.services.voiceService.textToSpeech(text, voiceId);
        res.json({ audio });
      } catch (error) {
        console.error('Error en /voice/tts:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.router.post('/voice/stt', async (req, res) => {
      try {
        const audioData = req.body.audio || req.body.data;
        const transcript = await this.services.voiceService.speechToText(audioData);
        res.json({ transcript });
      } catch (error) {
        console.error('Error en /voice/stt:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Vision Service
    this.router.post('/vision/analyze', async (req, res) => {
      try {
        const { image, prompt } = req.body;
        const analysis = await this.services.visionService.analyzeImage(image, prompt);
        res.json(analysis);
      } catch (error) {
        console.error('Error en /vision/analyze:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Commands Service
    this.router.post('/commands/execute', async (req, res) => {
      try {
        const { command, params } = req.body;
        const result = await this.services.commandsService.execute(command, params);
        res.json(result);
      } catch (error) {
        console.error('Error en /commands/execute:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Scheduler Service
    this.router.post('/scheduler/snapshot', async (req, res) => {
      try {
        const snapshot = await this.services.schedulerService.createSnapshot();
        res.json(snapshot);
      } catch (error) {
        console.error('Error en /scheduler/snapshot:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.router.get('/scheduler/alarms', async (req, res) => {
      try {
        const alarms = await this.services.schedulerService.getActiveAlarms();
        res.json({ alarms });
      } catch (error) {
        console.error('Error en /scheduler/alarms:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Public APIs Search
    this.router.get('/public-apis/search', async (req, res) => {
      try {
        const { q } = req.query;
        if (!q) {
          return res.status(400).json({ error: 'Query parameter "q" required' });
        }
        const PublicAPIsIndexer = require('../utils/public-apis-indexer');
        const indexer = new PublicAPIsIndexer();
        await indexer.loadIndex();
        const results = indexer.search(q);
        res.json({ results, count: results.length });
      } catch (error) {
        console.error('Error en /public-apis/search:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Status endpoint
    this.router.get('/status', (req, res) => {
      res.json({
        status: 'ok',
        services: {
          chat: this.services.chatService.isReady(),
          voice: this.services.voiceService.isReady(),
          vision: this.services.visionService.isReady(),
          commands: this.services.commandsService.isReady(),
          scheduler: this.services.schedulerService.isReady()
        },
        timestamp: new Date().toISOString()
      });
    });
  }
}

module.exports = MCPRouter;

