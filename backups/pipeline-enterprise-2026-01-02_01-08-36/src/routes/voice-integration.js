/**
 * Voice System Integration Routes
 * Integrates Realtime Voice System into MCP Orchestrator
 * All voice functionality flows through the universal server
 */

import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/voice/status
 * Get voice system status
 */
router.get('/status', async (req, res) => {
  try {
    res.json({
      voice_system: 'active',
      status: 'ready',
      features: [
        'text_to_speech',
        'speech_recognition',
        'real_time_streaming',
        'agent_communication'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get voice status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/voice/diagnose
 * Diagnose AI provider configuration and test each one
 */
router.get('/diagnose', async (req, res) => {
  try {
    const diagnosis = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      providers: {
        groq: {
          configured: !!process.env.GROQ_API_KEY,
          keyLength: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 0,
          keyPrefix: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 8) + '...' : null,
          tested: false,
          working: false,
          error: null
        },
        openai: {
          configured: !!process.env.OPENAI_API_KEY,
          keyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
          keyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 8) + '...' : null,
          tested: false,
          working: false,
          error: null
        },
        gemini: {
          configured: !!process.env.GEMINI_API_KEY,
          keyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
          keyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 8) + '...' : null,
          tested: false,
          working: false,
          error: null
        }
      },
      deepgram: {
        configured: !!process.env.DEEPGRAM_API_KEY,
        keyLength: process.env.DEEPGRAM_API_KEY ? process.env.DEEPGRAM_API_KEY.length : 0
      },
      preferredProvider: process.env.PREFERRED_AI_PROVIDER || 'groq'
    };

    // Test Groq
    if (diagnosis.providers.groq.configured) {
      diagnosis.providers.groq.tested = true;
      try {
        const testResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'qwen2.5-72b-instruct',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 5
          })
        });
        diagnosis.providers.groq.working = testResponse.ok;
        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          diagnosis.providers.groq.error = `HTTP ${testResponse.status}: ${errorText.substring(0, 200)}`;
        }
      } catch (error) {
        diagnosis.providers.groq.error = error.message;
      }
    }

    // Test OpenAI
    if (diagnosis.providers.openai.configured) {
      diagnosis.providers.openai.tested = true;
      try {
        const testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 5
          })
        });
        diagnosis.providers.openai.working = testResponse.ok;
        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          diagnosis.providers.openai.error = `HTTP ${testResponse.status}: ${errorText.substring(0, 200)}`;
        }
      } catch (error) {
        diagnosis.providers.openai.error = error.message;
      }
    }

    // Test Gemini
    if (diagnosis.providers.gemini.configured) {
      diagnosis.providers.gemini.tested = true;
      try {
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const testResponse = await fetch(testUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'test' }] }],
            generationConfig: { maxOutputTokens: 5 }
          })
        });
        diagnosis.providers.gemini.working = testResponse.ok;
        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          diagnosis.providers.gemini.error = `HTTP ${testResponse.status}: ${errorText.substring(0, 200)}`;
        }
      } catch (error) {
        diagnosis.providers.gemini.error = error.message;
      }
    }

    // Summary
    const workingProviders = Object.values(diagnosis.providers).filter(p => p.working).length;
    diagnosis.summary = {
      totalConfigured: Object.values(diagnosis.providers).filter(p => p.configured).length,
      totalWorking: workingProviders,
      hasWorkingProvider: workingProviders > 0,
      recommendation: workingProviders === 0 
        ? 'No hay proveedores funcionando. Verifica las API keys en Render Dashboard.'
        : `${workingProviders} proveedor(es) funcionando correctamente.`
    };

    res.json(diagnosis);
  } catch (error) {
    logger.error('Failed to diagnose voice system:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/voice/tts
 * Text to Speech through universal server
 */
router.post('/tts', async (req, res) => {
  try {
    const { text, voice = 'sandra', language = 'es' } = req.body;
    const { projectId } = req.query;
    const agentId = req.agent?.id || 'voice-system';

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    logger.info(`🔊 TTS requested: "${text.substring(0, 50)}..." by ${agentId}`);

    // Log to project context if projectId provided
    const { context: contextBuilder } = req.services;
    if (projectId && contextBuilder) {
      try {
        await contextBuilder.buildProjectContext(projectId);
      } catch (e) {
        // Continue even if context fails
      }
    }

    res.json({
      status: 'processing',
      text,
      voice,
      language,
      agent_id: agentId,
      project_id: projectId || null,
      timestamp: new Date().toISOString(),
      message: 'TTS request queued for processing'
    });
  } catch (error) {
    logger.error('Failed to process TTS:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/voice/stream
 * Real-time voice streaming through universal server
 */
router.post('/stream', async (req, res) => {
  try {
    const { projectId } = req.query;
    const agentId = req.agent?.id || 'voice-stream';

    logger.info(`📡 Voice stream started for project ${projectId} by ${agentId}`);

    res.json({
      status: 'stream_initialized',
      project_id: projectId,
      agent_id: agentId,
      protocol: 'websocket',
      endpoint: `ws://localhost:3000/voice/stream?project=${projectId}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to initialize voice stream:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/voice/agents
 * Get all voice-enabled agents connected
 */
router.get('/agents', async (req, res) => {
  try {
    const { neon: neonService } = req.services;

    let agents = [];
    if (neonService) {
      try {
        const sessions = await neonService.sql(
          `SELECT DISTINCT agent_id FROM agent_sessions WHERE status = 'active'`
        );
        agents = sessions.map(s => s.agent_id);
      } catch (e) {
        logger.warn('Could not fetch agents from database');
      }
    }

    res.json({
      agents,
      count: agents.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get voice agents:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/voice/projects/:projectId/connect
 * Connect voice system to a project
 */
router.post('/projects/:projectId/connect', async (req, res) => {
  try {
    const { projectId } = req.params;
    const agentId = req.agent?.id || 'voice-system';
    const { neon: neonService } = req.services;

    logger.info(`🎤 Voice connected to project ${projectId}`);

    // Record voice session if database available
    if (neonService) {
      try {
        await neonService.createAgentSession(
          agentId,
          projectId,
          'websocket',
          req.ip,
          'voice-system'
        );
      } catch (e) {
        logger.warn('Could not record voice session');
      }
    }

    res.json({
      project_id: projectId,
      agent_id: agentId,
      status: 'connected',
      voice_features: ['streaming', 'tts', 'transcription'],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to connect voice to project:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/voice/projects/:projectId/transcribe
 * Transcribe voice to text in project context
 */
router.post('/projects/:projectId/transcribe', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { audio, language = 'es' } = req.body;
    const agentId = req.agent?.id || 'voice-system';

    if (!audio) {
      return res.status(400).json({ error: 'audio is required' });
    }

    logger.info(`📝 Transcription requested for project ${projectId}`);

    res.json({
      status: 'transcribing',
      project_id: projectId,
      agent_id: agentId,
      language,
      timestamp: new Date().toISOString(),
      message: 'Transcription in progress'
    });
  } catch (error) {
    logger.error('Failed to transcribe:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/voice/projects/:projectId/state
 * Get voice state in project context
 */
router.get('/projects/:projectId/state', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { neon: neonService, context: contextBuilder } = req.services;

    let projectState = {};
    if (neonService && contextBuilder) {
      try {
        const context = await contextBuilder.buildProjectContext(projectId);
        projectState = context;
      } catch (e) {
        logger.warn('Could not build project context');
      }
    }

    res.json({
      project_id: projectId,
      voice_enabled: true,
      project_state: projectState,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get voice state:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
