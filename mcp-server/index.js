/**
 * MCP-SANDRA Server v1.0.0
 * Model Context Protocol - Orquestador Central para Sandra IA
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
const sandraRoutes = require('./routes/sandra'); // NEW: Routes from api-gateway.js

// Import Services
const GeminiService = require('./services/gemini'); // Switched from Qwen to Gemini
const CartesiaService = require('./services/cartesia');
const BridgeDataService = require('./services/bridgeData');
const TranscriberService = require('./services/transcriber');
const VideoSyncService = require('./services/videoSync');
const AmbientationService = require('./services/ambientation');
const SnapshotService = require('./services/snapshot');
const PublicAPIsService = require('./services/publicAPIs');

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
  qwen: new GeminiService(), // Alias 'qwen' to GeminiService to keep route compatibility without refactoring everything
  cartesia: new CartesiaService(),
  bridgeData: new BridgeDataService(),
  transcriber: new TranscriberService(),
  videoSync: new VideoSyncService(),
  ambientation: new AmbientationService(),
  snapshot: new SnapshotService(),
  publicAPIs: new PublicAPIsService()
};

// Hacer servicios disponibles para rutas MCP
app.locals.services = services;

// Initialize all services
async function initializeServices() {
  console.log('🔧 Inicializando servicios...');
  
  try {
    await services.ambientation.initialize();
    await services.publicAPIs.initialize();
    await services.snapshot.initialize();
    
    console.log('✅ Todos los servicios inicializados\n');
  } catch (error) {
    console.error('❌ Error inicializando servicios:', error);
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
app.use('/api/sandra', sandraRoutes); // NEW: Mount the ported routes

// Health Check (Render expects /healthz)
app.get(['/health', '/healthz'], (req, res) => {
  res.json({
    status: 'ok',
    server: 'MCP-SANDRA',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      qwen: services.qwen.isReady(),
      cartesia: services.cartesia.isReady(),
      bridgeData: services.bridgeData.isReady(),
      transcriber: services.transcriber.isReady(),
      videoSync: services.videoSync.isReady(),
      ambientation: services.ambientation.isReady(),
      snapshot: services.snapshot.isReady(),
      publicAPIs: services.publicAPIs.isReady()
    }
  });
});

// Status endpoint
app.get('/api/status', authMiddleware, (req, res) => {
  res.json({
    status: 'operational',
    server: 'MCP-SANDRA',
    version: '1.0.0',
    uptime: process.uptime(),
    services: {
      qwen: services.qwen.getStatus(),
      cartesia: services.cartesia.getStatus(),
      bridgeData: services.bridgeData.getStatus(),
      videoSync: services.videoSync.getStatus(),
      ambientation: services.ambientation.getStatus()
    },
    timestamp: new Date().toISOString()
  });
});

// Serve Static Files (PWA) - STRICT ISOLATION
// Do not serve the entire root. Only specific assets and index.html if needed here.
// However, since this is the MCP server (backend), it might be better to NOT serve frontend at all unless required.
// If this server doubles as the PWA host on Render, we must be strict.

app.use('/assets', express.static(path.join(__dirname, '../assets')));

app.get('/', (req, res) => {
  const index = path.join(__dirname, '../index.html');
  if (fs.existsSync(index)) {
    res.sendFile(index);
  } else {
    res.status(404).send('PWA Index not found');
  }
});

// WebSocket Server
const wss = new WebSocket.Server({ 
  server,
  verifyClient: (info, callback) => {
    const token = info.req.url.split('token=')[1]?.split('&')[0] || 
                  info.req.headers['authorization']?.replace('Bearer ', '');
    
    if (token === process.env.SANDRA_TOKEN || !process.env.REQUIRE_AUTH) {
      callback(true);
    } else {
      callback(false, 401, 'Unauthorized');
    }
  }
});

wss.on('connection', (ws, req) => {
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🔌 Nueva conexión WebSocket: ${clientId}`);
  
  ws.clientId = clientId;
  ws.isAlive = true;
  
  // Heartbeat
  ws.on('pong', () => {
    ws.isAlive = true;
  });
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      const { route, action, payload } = data;
      
      let response;
      switch (route) {
        case 'audio':
          response = await handleAudioRoute(action, payload, services, ws);
          break;
        case 'video':
          response = await handleVideoRoute(action, payload, services, ws);
          break;
        case 'conserje':
          response = await handleConserjeRoute(action, payload, services, ws);
          break;
        case 'sync':
          response = await handleSyncRoute(action, payload, services, ws);
          break;
        case 'apis':
          response = await handleAPIsRoute(action, payload, services, ws);
          break;
        default:
          response = { error: 'Unknown route', route };
      }
      
      if (response) {
        ws.send(JSON.stringify({
          route,
          action,
          ...response
        }));
      }
    } catch (error) {
      console.error('Error procesando mensaje WebSocket:', error);
      ws.send(JSON.stringify({ error: error.message }));
    }
  });
  
  ws.on('close', () => {
    console.log(`🔌 Conexión cerrada: ${clientId}`);
  });
  
  ws.on('error', (error) => {
    console.error(`Error en WebSocket ${clientId}:`, error);
  });
  
  ws.send(JSON.stringify({
    route: 'system',
    action: 'connected',
    clientId,
    timestamp: new Date().toISOString()
  }));
});

// Heartbeat interval
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// Route handlers
async function handleAudioRoute(action, payload, services, ws) {
  switch (action) {
    case 'tts':
      const audio = await services.cartesia.textToSpeech(payload.text, payload.voiceId);
      return { 
        payload: { 
          audio, 
          format: 'mp3',
          isWelcome: payload.isWelcome || false
        }
      };
    case 'stt':
      const transcript = await services.transcriber.transcribe(payload.audio);
      console.log('🎤 [MCP] Audio transcrito:', transcript);
      
      if (!transcript || !transcript.trim()) {
        ws.send(JSON.stringify({
          route: 'conserje',
          action: 'message',
          payload: {
            type: 'noSpeech',
            message: 'No he podido oírte bien. ¿Puedes repetirlo, por favor?'
          }
        }));
        return null;
      }
      
      const aiResponse = await services.qwen.processMessage(transcript, {
        context: payload.context || {},
        role: 'conserje',
        bridgeData: await services.bridgeData.getContext(),
        ambientation: await services.ambientation.getCurrentAmbientation()
      });
      
      console.log('🧠 [MCP] Respuesta de IA:', aiResponse);
      const responseAudio = await services.cartesia.textToSpeech(aiResponse, payload.voiceId);
      
      console.log('🔊 [MCP] Audio generado, enviando respuesta...');
      
      ws.send(JSON.stringify({
        route: 'audio',
        action: 'tts',
        payload: {
          audio: responseAudio,
          format: 'mp3',
          text: aiResponse,
          isWelcome: payload.isWelcome || false
        }
      }));
      
      return { 
        transcript,
        text: aiResponse,
        audioSent: true
      };
    default:
      return { error: 'Unknown action' };
  }
}

async function handleVideoRoute(action, payload, services, ws) {
  switch (action) {
    case 'get_ambientation':
      const ambient = await services.ambientation.getCurrentAmbientation(payload.timezone);
      return { ambientation: ambient };
    case 'sync':
      const syncData = await services.videoSync.syncVideoAudio(payload);
      return { sync: syncData };
    default:
      return { error: 'Unknown action' };
  }
}

async function handleConserjeRoute(action, payload, services, ws) {
  switch (action) {
    case 'message':
      if (payload.type === 'ready' || payload.message?.includes('listo para recibir saludo')) {
        console.log('👋 [MCP] Cliente listo, cargando saludo inicial GRABADO...');
        
        try {
          const welcomeAudioPath = path.join(__dirname, 'assets/audio/welcome.mp3');
          
          if (!fs.existsSync(welcomeAudioPath)) {
            console.error('❌ [MCP] ERROR: Archivo de audio grabado no encontrado:', welcomeAudioPath);
            throw new Error('Archivo de audio de bienvenida no encontrado');
          }
          
          const welcomeAudioBuffer = fs.readFileSync(welcomeAudioPath);
          const welcomeAudio = welcomeAudioBuffer.toString('base64');
          const welcomeText = '¡Hola! Soy Sandra. Bienvenido a GuestsValencia. ¿En qué puedo ayudarte hoy?';
          
          ws.send(JSON.stringify({
            route: 'audio',
            action: 'tts',
            payload: {
              audio: welcomeAudio,
              format: 'mp3',
              text: welcomeText,
              isWelcome: true
            }
          }));
          return null;
        } catch (error) {
          console.error('❌ [MCP] Error cargando audio grabado:', error.message);
          ws.send(JSON.stringify({
            route: 'conserje',
            action: 'message',
            payload: {
              type: 'error',
              message: 'Error cargando saludo inicial'
            }
          }));
          return null;
        }
      }
      
      const response = await services.qwen.processMessage(payload.message, {
        context: payload.context,
        role: 'conserje',
        bridgeData: await services.bridgeData.getContext(),
        ambientation: await services.ambientation.getCurrentAmbientation()
      });
      return { response };
    case 'stream':
      return { streaming: true };
    default:
      return { error: 'Unknown action' };
  }
}

async function handleSyncRoute(action, payload, services, ws) {
  switch (action) {
    case 'sync':
      return await services.videoSync.syncVideoAudio(payload);
    case 'status':
      return services.videoSync.getStatus();
    default:
      return { error: 'Unknown action' };
  }
}

async function handleAPIsRoute(action, payload, services, ws) {
  switch (action) {
    case 'search':
      const results = await services.publicAPIs.search(payload.query);
      return { results };
    case 'get':
      const api = await services.publicAPIs.getAPI(payload.name);
      return { api };
    default:
      return { error: 'Unknown action' };
  }
}

// Error Handler
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || process.env.MCP_PORT || 4042;
const HOST = process.env.MCP_HOST || '0.0.0.0';

async function start() {
  await initializeServices();
  
  // Inicializar sistema de subagentes automáticos
  subagentesSystem.inicializar();
  
  server.listen(PORT, HOST, () => {
    console.log('='.repeat(60));
    console.log('🚀 MCP-SANDRA Server v1.0.0');
    console.log('='.repeat(60));
    console.log(`📡 HTTP Server: http://${HOST}:${PORT}`);
    console.log(`🔌 WebSocket Server: ws://${HOST}:${PORT}`);
    console.log(`🌐 Health Check: http://${HOST}:${PORT}/health (or /healthz)`);
    console.log(`🔗 API Base: http://${HOST}:${PORT}/api`);
    console.log('='.repeat(60));
    console.log('✨ Servidor iniciado y listo para orquestar Sandra IA\n');
  });
}

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Cerrando MCP-SANDRA Server...');
  await services.snapshot.createSnapshot('shutdown');
  server.close(() => {
    console.log('✅ MCP-SANDRA Server cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🛑 Cerrando MCP-SANDRA Server...');
  await services.snapshot.createSnapshot('shutdown');
  server.close(() => {
    process.exit(0);
  });
});

// Start
start().catch(error => {
  console.error('❌ Error iniciando servidor:', error);
  process.exit(1);
});

module.exports = { app, server, wss, services };
