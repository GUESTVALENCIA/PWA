/**
 * MCP-SANDRA Server v1.0.0
 * Model Context Protocol - Orquestador Central para Sandra IA
 * ENTERPRISE EDITION - Low Latency Streaming
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import Routes
const audioRoutes = require('./routes/audio');
const videoRoutes = require('./routes/video');
const conserjeRoutes = require('./routes/conserje');
const syncRoutes = require('./routes/sync');
const apisRoutes = require('./routes/apis');
const mcpRoutes = require('./routes/mcp');
const sandraRoutes = require('./routes/sandra');

// Import Services
const QwenService = require('./services/qwen');
const StaticVoiceService = require('./services/voice-static');
const BridgeDataService = require('./services/bridgeData');
const TranscriberService = require('./services/transcriber');
const VideoSyncService = require('./services/videoSync');
const AmbientationService = require('./services/ambientation');
const SnapshotService = require('./services/snapshot');
const PublicAPIsService = require('./services/publicAPIs');

// ENTERPRISE STREAMING SERVICES
const DeepgramStreamingService = require('./services/deepgram-streaming');
const LLMStreamingService = require('./services/llm-streaming');
const TTSStreamingService = require('./services/tts-streaming');

// Import Subagentes System
const subagentesSystem = require('./agents/subagentes_mcp_setup');

// Import Middleware
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Services
const services = {
  qwen: new QwenService(),
  voice: new StaticVoiceService(),
  bridgeData: new BridgeDataService(),
  transcriber: new TranscriberService(),
  videoSync: new VideoSyncService(),
  ambientation: new AmbientationService(),
  snapshot: new SnapshotService(),
  publicAPIs: new PublicAPIsService(),

  // Enterprise Streaming
  deepgramStreaming: new DeepgramStreamingService(process.env.DEEPGRAM_API_KEY),
  llmStreaming: new LLMStreamingService(),
  ttsStreaming: new TTSStreamingService()
};

app.locals.services = services;

// Initialize all services
async function initializeServices() {
  console.log(' Inicializando servicios...');
  try {
    await services.ambientation.initialize();
    await services.publicAPIs.initialize();
    await services.snapshot.initialize();
    console.log(' Todos los servicios inicializados\n');
  } catch (error) {
    console.error(' Error inicializando servicios:', error);
    process.exit(1);
  }
}

// Routes
app.use('/api/audio', audioRoutes(services));
app.use('/api/video', videoRoutes(services));
app.use('/api/conserje', conserjeRoutes(services));
app.use('/api/sync', syncRoutes(services));
app.use('/api/apis', apisRoutes(services));
app.use('/api', mcpRoutes);
app.use('/api/sandra', sandraRoutes);

// Health Check
app.get(['/health', '/healthz'], (req, res) => {
  res.json({
    status: 'ok',
    server: 'MCP-SANDRA-ENTERPRISE',
    timestamp: new Date().toISOString()
  });
});

// Status endpoint
app.get('/api/status', authMiddleware, (req, res) => {
  res.json({ status: 'operational', server: 'MCP-SANDRA', timestamp: new Date().toISOString() });
});

// Serve Static Files
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.get('/', (req, res) => {
  const index = path.join(__dirname, '../index.html');
  if (fs.existsSync(index)) res.sendFile(index);
  else res.status(404).send('PWA Index not found');
});

// API Config
app.get('/api/config', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.json({
    MCP_SERVER_URL: 'wss://pwa-imbf.onrender.com', // Always ensure this points to correct endpoint
    MCP_TOKEN: process.env.MCP_TOKEN || null
  });
});

// WebSocket Server Enterprise
const wss = new WebSocket.Server({
  server,
  perMessageDeflate: false, // Optimized for streaming
  clientTracking: true,
  maxPayload: 500 * 1024 * 1024 // Large payload allow
});

wss.on('connection', (ws, req) => {
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(` Nueva conexión Enterprise: ${clientId}`);

  ws.clientId = clientId;
  ws.isAlive = true;

  // PIPELINE STATE
  ws.isProcessing = false;
  // Instantiate streaming session for this client
  ws.dgSession = new DeepgramStreamingService(process.env.DEEPGRAM_API_KEY);

  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', async (message) => {
    // BINARY HANDLING (Raw PCM Audio)
    if (Buffer.isBuffer(message) || message instanceof ArrayBuffer) {
      if (ws.dgSession) {
        ws.dgSession.sendAudio(message);
      }
      return;
    }

    // JSON HANDLING
    try {
      const data = JSON.parse(message);

      // If config message
      if (data.type === 'config') {
        console.log(`[WS] Config received: ${data.sampleRate}`);
        // Start Deepgram Stream
        ws.dgSession.startStream(async (transcriptData) => {
          // On Transcript Received (Deepgram -> LLM)
          if (transcriptData.isFinal || transcriptData.isSpeechFinal) {
            const text = transcriptData.text;
            console.log(`[PIPELINE] User: ${text}`);

            // Send transcript to client for UI
            ws.send(JSON.stringify({
              route: 'conserje',
              action: 'transcription',
              payload: { text: text, role: 'user' }
            }));

            // Trigger LLM Streaming
            processLLMResponse(text, ws);
          }
        });
        return;
      }

      // Handle standard MCP messages
      // Fallback to standard routing for non-streaming control messages (like initial handshake if JSON)
      await handleStandardMCP(data, services, ws);

    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log(` Conexión cerrada: ${clientId}`);
    if (ws.dgSession) ws.dgSession.cleanup();
  });
});

async function processLLMResponse(userText, ws) {
  if (ws.isProcessing) return;
  ws.isProcessing = true;

  try {
    const stream = services.llmStreaming.streamResponse(userText);

    // Start TTS Stream (Cartesia)
    const ttsGen = services.ttsStreaming.streamAudio(stream);

    // Consume audio chunks from TTS and send to client
    for await (const audioChunk of ttsGen) {
      if (ws.readyState === WebSocket.OPEN) {
        // Send raw binary to client
        ws.send(audioChunk);
      }
    }

  } catch (e) {
    console.error('Pipeline Error:', e);
  } finally {
    ws.isProcessing = false;
    ws.send(JSON.stringify({ route: 'conserje', action: 'response_complete', payload: { text: "Done" } }));
  }
}

async function handleStandardMCP(data, services, ws) {
  const { route, action, payload } = data;

  // Quick welcome handler
  if (route === 'conserje' && action === 'message' && payload.type === 'ready') {
    const welcomeText = "Hola, soy Sandra. ¿En qué puedo ayudarte?";
    const audio = await services.voice.textToSpeech(welcomeText);
    ws.send(JSON.stringify({
      route: 'audio',
      action: 'tts',
      payload: { audio, format: 'mp3', text: welcomeText, isWelcome: true }
    }));
  } else if (route === 'audio' && action === 'tts') {
    // Explicit TTS request
    const audio = await services.voice.textToSpeech(payload.text, payload.voiceId);
    ws.send(JSON.stringify({
      route: 'audio',
      action: 'tts',
      payload: { audio, format: 'mp3', text: payload.text, isWelcome: false }
    }));
  }
  // Add other routes as needed based on original file...
}

// Heartbeat
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// Start
const PORT = process.env.PORT || 4042;
server.listen(PORT, '0.0.0.0', () => {
  console.log(` MCP-SANDRA Enterprise Server running on port ${PORT}`);
});

module.exports = { app, server, wss, services };
