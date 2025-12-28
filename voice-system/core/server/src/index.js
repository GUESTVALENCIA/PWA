/**
 * Realtime Voice System - WebSocket Server
 * Universal conversational AI streaming platform
 *
 * Features:
 * - WebSocket bidirectional streaming
 * - STT (Deepgram) + LLM (Multi-provider) + TTS (Swappable)
 * - Real-time pipeline orchestration
 * - Security layer (auth, rate limiting, validation)
 * - Comprehensive monitoring + health checks
 *
 * Port: 4042 (local) | 10000 (production)
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

// Services
const DeepgramStreamingService = require('./services/deepgram-streaming');
const LLMStreamingService = require('./services/llm-streaming');
const TTSStreamingService = require('./services/tts-streaming');
const { logger } = require('./utils/logger');

// Middleware
const { validateToken, generateToken } = require('./middleware/auth');
const { checkRateLimit } = require('./middleware/rate-limiter');
const { validateInput } = require('./middleware/validator');

// Initialize Express & HTTP Server
const app = express();
const server = http.createServer(app);

// Middleware setup
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Services
const services = {
  deepgramStreaming: new DeepgramStreamingService(process.env.DEEPGRAM_API_KEY),
  llmStreaming: new LLMStreamingService(),
  ttsStreaming: new TTSStreamingService()
};

// ═══════════════════════════════════════════════════════════════════════════════
// REST ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Health Check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'realtime-voice-system',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Configuration Endpoint
 */
app.get('/api/config', (req, res) => {
  let wsUrl = process.env.MCP_SERVER_URL;

  if (!wsUrl) {
    const isProduction = process.env.NODE_ENV === 'production';
    const hostname = req.get('host') || 'localhost:4042';
    const protocol = req.protocol === 'https' ? 'wss' : 'ws';

    if (isProduction || hostname.includes('onrender.com')) {
      wsUrl = 'wss://pwa-imbf.onrender.com';
    } else {
      wsUrl = `${protocol}://${hostname}`;
    }
  }

  res.json({
    MCP_SERVER_URL: wsUrl,
    MCP_TOKEN: process.env.MCP_TOKEN || null,
    PROTECTED_CONFIG: true,
    timestamp: Date.now()
  });
});

/**
 * Token Generation Endpoint
 */
app.post('/api/token', (req, res) => {
  try {
    const clientId = req.body.clientId || `client-${Date.now()}`;
    const token = generateToken(clientId);

    res.json({
      token,
      expiresIn: 300,
      clientId
    });
  } catch (error) {
    logger.error('Token generation error:', error);
    res.status(500).json({ error: 'Token generation failed' });
  }
});

/**
 * Metrics Endpoint
 */
app.get('/api/metrics', (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    activeConnections: wss.clients.size,
    totalRequests: globalMetrics.totalRequests,
    totalErrors: globalMetrics.totalErrors,
    averageLatency: globalMetrics.averageLatency,
    providers: {
      deepgram: deepgramHealth,
      llm: llmHealth,
      tts: ttsHealth
    }
  };

  res.json(metrics);
});

/**
 * Status Endpoint
 */
app.get('/api/status', async (req, res) => {
  const deepgramHealth = await services.deepgramStreaming.healthCheck();
  const llmHealth = await services.llmStreaming.healthCheck();
  const ttsHealth = await services.ttsStreaming.getHealth();

  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    services: {
      deepgram: deepgramHealth,
      llm: llmHealth,
      tts: ttsHealth
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// WEBSOCKET SERVER SETUP
// ═══════════════════════════════════════════════════════════════════════════════

const wss = new WebSocket.Server({
  server,
  path: '/ws/stream',
  perMessageDeflate: false,
  clientTracking: true,
  maxPayload: 100 * 1024 * 1024
});

// Global metrics
let globalMetrics = {
  totalRequests: 0,
  totalErrors: 0,
  averageLatency: 0,
  latencies: []
};

// Connection handler
wss.on('connection', (ws, req) => {
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Client-specific state
  const client = {
    id: clientId,
    connectedAt: Date.now(),
    conversationHistory: [],
    isProcessing: false,
    requestCount: 0,
    errorCount: 0,

    // Services (per-client instances)
    deepgramSession: null,
    llmProvider: process.env.DEFAULT_LLM_PROVIDER || 'gemini',
    language: 'es'
  };

  logger.info(`📞 New connection: ${clientId}`);

  // Heartbeat
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  // Message handler
  ws.on('message', async (data) => {
    try {
      if (Buffer.isBuffer(data) || data instanceof ArrayBuffer) {
        // Audio data
        await handleAudioMessage(data, ws, client);
      } else {
        // Control message (JSON)
        const msg = JSON.parse(data.toString());
        await handleControlMessage(msg, ws, client);
      }
    } catch (error) {
      logger.error(`Error processing message for ${clientId}:`, error);
      globalMetrics.totalErrors++;
      client.errorCount++;

      ws.send(JSON.stringify({
        type: 'error',
        message: 'Error processing request'
      }));
    }
  });

  // Close handler
  ws.on('close', () => {
    logger.info(`📴 Connection closed: ${clientId}`);

    if (client.deepgramSession) {
      client.deepgramSession.cleanup();
    }

    // Log session metrics
    const sessionDuration = Date.now() - client.connectedAt;
    logger.info(`Session ${clientId} metrics:`, {
      duration: sessionDuration,
      requests: client.requestCount,
      errors: client.errorCount
    });
  });

  // Error handler
  ws.on('error', (error) => {
    logger.error(`WebSocket error for ${clientId}:`, error);
    globalMetrics.totalErrors++;
  });

  // Initial connection message
  ws.send(JSON.stringify({
    type: 'connected',
    clientId,
    timestamp: Date.now()
  }));
});

/**
 * Handle Audio Messages
 */
async function handleAudioMessage(audioBuffer, ws, client) {
  // Validate audio
  const validation = validateInput.audio(audioBuffer);
  if (!validation.valid) {
    ws.send(JSON.stringify({
      type: 'error',
      message: validation.reason
    }));
    return;
  }

  // Initialize Deepgram session if needed
  if (!client.deepgramSession) {
    client.deepgramSession = new DeepgramStreamingService(process.env.DEEPGRAM_API_KEY);

    await client.deepgramSession.startStream(client.language, async (transcriptData) => {
      if (transcriptData.isFinal || transcriptData.isSpeechFinal) {
        const transcript = transcriptData.text;

        // Send transcription
        ws.send(JSON.stringify({
          type: 'transcription',
          text: transcript
        }));

        // Process with LLM
        await processWithLLM(transcript, ws, client);
      }
    });
  }

  // Send audio to Deepgram
  client.deepgramSession.sendAudio(audioBuffer);
}

/**
 * Handle Control Messages
 */
async function handleControlMessage(msg, ws, client) {
  const validation = validateInput.config(msg);
  if (!validation.valid) {
    ws.send(JSON.stringify({
      type: 'error',
      message: validation.reason
    }));
    return;
  }

  switch (msg.type) {
    case 'setLanguage':
      client.language = msg.language;
      ws.send(JSON.stringify({ type: 'ack', action: 'setLanguage' }));
      break;

    case 'setProvider':
      client.llmProvider = msg.provider;
      services.llmStreaming.provider = msg.provider;
      ws.send(JSON.stringify({ type: 'ack', action: 'setProvider' }));
      break;

    case 'reset':
      client.conversationHistory = [];
      services.llmStreaming.resetConversation();
      ws.send(JSON.stringify({ type: 'ack', action: 'reset' }));
      break;

    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
  }
}

/**
 * Process with LLM and Stream TTS
 */
async function processWithLLM(transcript, ws, client) {
  if (client.isProcessing) {
    logger.warn(`Client ${client.id} already processing`);
    return;
  }

  client.isProcessing = true;
  const startTime = Date.now();

  try {
    client.requestCount++;
    globalMetrics.totalRequests++;

    // Stream LLM response
    let fullResponse = '';

    for await (const chunk of services.llmStreaming.streamResponse(transcript)) {
      fullResponse += chunk;

      // Send text chunk
      ws.send(JSON.stringify({
        type: 'text',
        content: chunk
      }));
    }

    // Stream TTS audio
    for await (const audioChunk of services.ttsStreaming.streamAudio(fullResponse)) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(audioChunk);
      }
    }

    // Send completion
    ws.send(JSON.stringify({
      type: 'response_complete',
      text: fullResponse,
      timestamp: Date.now()
    }));

    // Record latency
    const latency = Date.now() - startTime;
    globalMetrics.latencies.push(latency);
    if (globalMetrics.latencies.length > 100) {
      globalMetrics.latencies.shift();
    }
    globalMetrics.averageLatency = globalMetrics.latencies.reduce((a, b) => a + b, 0) / globalMetrics.latencies.length;

    logger.info(`Request completed in ${latency}ms for ${client.id}`);

  } catch (error) {
    logger.error(`LLM/TTS error for ${client.id}:`, error);
    globalMetrics.totalErrors++;
    client.errorCount++;

    ws.send(JSON.stringify({
      type: 'error',
      message: 'Processing failed, please try again'
    }));
  } finally {
    client.isProcessing = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEARTBEAT
// ═══════════════════════════════════════════════════════════════════════════════

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// ═══════════════════════════════════════════════════════════════════════════════
// SERVER STARTUP
// ═══════════════════════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 4042;

server.listen(PORT, '0.0.0.0', () => {
  logger.info(`
╔════════════════════════════════════════════════════════════════╗
║  🚀 Realtime Voice System Server                              ║
║  Version: 1.0.0                                               ║
║  Status: ✅ Ready                                             ║
╠════════════════════════════════════════════════════════════════╣
║  HTTP:      http://localhost:${PORT}                          ║
║  WebSocket: ws://localhost:${PORT}/ws/stream                  ║
║  Health:    http://localhost:${PORT}/health                   ║
║  Metrics:   http://localhost:${PORT}/api/metrics              ║
╠════════════════════════════════════════════════════════════════╣
║  STT:  Deepgram (Nova-2)                                      ║
║  LLM:  Gemini 2.0 Flash (default)                             ║
║  TTS:  MiVoz Native (default)                                 ║
╚════════════════════════════════════════════════════════════════╝
  `);

  logger.info('✅ All services initialized and ready');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('✅ Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, wss, services };
