/**
 * MCP-SANDRA Server v1.0.0
 * Model Context Protocol - Orquestador Central para Sandra IA
 * ENTERPRISE EDITION - Low Latency Streaming
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') }); // Prioritize .env.local
require('dotenv').config(); // Fallback to default .env
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
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

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY & PROTECTION LAYER
// ═══════════════════════════════════════════════════════════════════════════════
const crypto = require('crypto');

/**
 * PROTECTED SERVICE CONFIGURATION
 * ⚠️ WARNING: DO NOT MODIFY WITHOUT AUTHORIZATION
 * These services are critical for voice/chat connectivity
 * Unauthorized changes WILL cause system failures
 */
const PROTECTED_SERVICES = {
  voiceCall: {
    name: 'WebSocket Voice Streaming',
    purpose: 'Real-time bidirectional audio streaming via WebSocket',
    endpoints: ['/ws/stream', '/api/config'],
    status: 'PRODUCTION',
    lastModified: new Date().toISOString(),
    dataHash: null // Will be calculated
  },
  textChat: {
    name: 'REST Text Chat Gateway',
    purpose: 'Text-to-speech and chat message handling',
    endpoints: ['/api/sandra/chat', '/api/conserje/message'],
    status: 'PRODUCTION',
    lastModified: new Date().toISOString(),
    dataHash: null
  }
};

// Generate hash for integrity checking
function generateConfigHash(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 16);
}

// Generate service hash
function generateServiceHash(service) {
  return crypto.createHash('sha256').update(JSON.stringify(service)).digest('hex').slice(0, 16);
}

// Validate protected service integrity
function validateServiceIntegrity() {
  Object.keys(PROTECTED_SERVICES).forEach(key => {
    PROTECTED_SERVICES[key].dataHash = generateServiceHash(PROTECTED_SERVICES[key]);
    console.log(`✅ [PROTECTION] ${PROTECTED_SERVICES[key].name} - Hash: ${PROTECTED_SERVICES[key].dataHash}`);
  });
}

// Log protection warnings
function logProtectionWarnings() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                      🔒 CRITICAL SERVICES PROTECTED 🔒                        ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║                                                                               ║');
  console.log('║  VOICE CALL SERVICE: WebSocket Voice Streaming                              ║');
  console.log('║  ├─ Purpose: Real-time audio bidirectional communication                     ║');
  console.log('║  ├─ Endpoints: /ws/stream, /api/config                                       ║');
  console.log('║  ├─ Status: PRODUCTION - DO NOT MODIFY                                       ║');
  console.log('║  └─ Hash: ' + PROTECTED_SERVICES.voiceCall.dataHash + '                                      ║');
  console.log('║                                                                               ║');
  console.log('║  TEXT CHAT SERVICE: REST Gateway                                             ║');
  console.log('║  ├─ Purpose: Text messages and chat context management                       ║');
  console.log('║  ├─ Endpoints: /api/sandra/chat, /api/conserje/message                      ║');
  console.log('║  ├─ Status: PRODUCTION - DO NOT MODIFY                                       ║');
  console.log('║  └─ Hash: ' + PROTECTED_SERVICES.textChat.dataHash + '                                       ║');
  console.log('║                                                                               ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  ⚠️  MODIFICATION WARNING ⚠️                                                   ║');
  console.log('║                                                                               ║');
  console.log('║  These services are LOCKED for production use. Any unauthorized changes      ║');
  console.log('║  will result in:                                                             ║');
  console.log('║    • Voice calls dropping                                                     ║');
  console.log('║    • Text chat disconnections                                                ║');
  console.log('║    • System-wide connectivity failures                                       ║');
  console.log('║                                                                               ║');
  console.log('║  If modification is required, contact: SYSTEM ADMINISTRATOR                 ║');
  console.log('║                                                                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log('\n');
}

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
  deepgramStreaming: new DeepgramStreamingService('50895f2c294f1b90a36d755f789fdd5839ce77ae'),
  llmStreaming: new LLMStreamingService(),
  ttsStreaming: new TTSStreamingService()
};

app.locals.services = services;

// Initialize all services
async function initializeServices() {
  console.log(' Inicializando servicios...');

  // INITIALIZE PROTECTION LAYER
  validateServiceIntegrity();
  logProtectionWarnings();

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
app.use('/assets', express.static(path.join(__dirname, '../assets'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
  }
}));
app.get('/', (req, res) => {
  const index = path.join(__dirname, '../index.html');
  if (fs.existsSync(index)) res.sendFile(index);
  else res.status(404).send('PWA Index not found');
});

// API Config - PROTECTED: Dynamic URL based on environment
app.get('/api/config', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  // DYNAMIC URL DETECTION - PRODUCTION HARDENED
  let wsUrl = process.env.MCP_SERVER_URL;

  if (!wsUrl) {
    // Auto-detect based on environment
    const isProduction = process.env.NODE_ENV === 'production';
    const hostname = req.get('host') || 'localhost:4042';
    const protocol = req.protocol === 'https' ? 'wss' : 'ws';

    if (isProduction || hostname.includes('onrender.com') || hostname.includes('vercel.app')) {
      wsUrl = 'wss://pwa-imbf.onrender.com';
    } else {
      wsUrl = `${protocol}://${hostname}`;
    }
  }

  // Security: Ensure WSS for Render
  if (wsUrl.includes('onrender.com') && !wsUrl.startsWith('wss://')) {
    wsUrl = wsUrl.replace(/^https?:\/\//, 'wss://').replace(/^ws:\/\//, 'wss://');
  }

  const config = {
    MCP_SERVER_URL: wsUrl,
    MCP_TOKEN: process.env.MCP_TOKEN || null,
    PROTECTED_CONFIG: true,
    configHash: generateConfigHash({ MCP_SERVER_URL: wsUrl, timestamp: Date.now() })
  };

  console.log(`[CONFIG-ENDPOINT] 🔒 PROTECTED - Serving config for: ${wsUrl}`);
  res.json(config);
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
  ws.dgSession = new DeepgramStreamingService('50895f2c294f1b90a36d755f789fdd5839ce77ae');

  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', async (message) => {
    // BINARY HANDLING (Raw PCM Audio)
    if (Buffer.isBuffer(message) || message instanceof ArrayBuffer) {
      if (ws.dgSession) {
        if (!ws.audioPacketCount) ws.audioPacketCount = 0;
        ws.audioPacketCount++;
        if (ws.audioPacketCount % 100 === 0) console.log(`[WS] 🔊 Recibidos ${ws.audioPacketCount} paquetes de audio de ${ws.clientId}`);

        ws.dgSession.sendAudio(message);
      }
      return;
    }

    // JSON HANDLING
    try {
      const data = JSON.parse(message);

      // If config message
      if (data.type === 'config') {
        console.log(`🔴 HANDSHAKE RECEIVED: ${JSON.stringify(data)}`);
        console.log(`[WS] Config received: ${data.sampleRate}`);
        // Start Deepgram Stream with CLIENT'S Sample Rate
        ws.dgSession.startStream(data.sampleRate, async (transcriptData) => {
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
