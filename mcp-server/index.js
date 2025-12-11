/**
 * MCP-SANDRA Server v1.0.0
 * Model Context Protocol - Orquestador Central para Sandra IA
 * 
 * Este servidor centraliza:
 * - Procesamiento conversacional (rol Conserje)
 * - Integración con PWA Vercel
 * - Lógica de control de llamadas por voz
 * - Orquestación multimodal (audio, video, texto)
 * - Sistema de ambientación por hora/día
 * - Integración interna de miles de APIs
 * - Capacidad de restauración y resiliencia
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

// Import Services
const QwenService = require('./services/qwen');
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
  qwen: new QwenService(),
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

// Health Check
app.get('/health', (req, res) => {
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

// WebSocket Server
const wss = new WebSocket.Server({ 
  server,
  verifyClient: (info, callback) => {
    // Verificar token en query string o header
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
      
      // Route to appropriate handler
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
  
  // Send welcome message
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
      // 1. Transcribir audio del usuario
      const transcript = await services.transcriber.transcribe(payload.audio);
      console.log('🎤 [MCP] Audio transcrito:', transcript);
      
      if (!transcript || !transcript.trim()) {
        // Si no hay transcripción, enviar mensaje de "no speech"
        ws.send(JSON.stringify({
          route: 'conserje',
          action: 'message',
          payload: {
            type: 'noSpeech',
            message: 'No he podido oírte bien. ¿Puedes repetirlo, por favor?'
          }
        }));
        return null; // No enviar respuesta adicional
      }
      
      // 2. Procesar con IA (Conserje) para obtener respuesta de texto
      const aiResponse = await services.qwen.processMessage(transcript, {
        context: payload.context || {},
        role: 'conserje',
        bridgeData: await services.bridgeData.getContext(),
        ambientation: await services.ambientation.getCurrentAmbientation()
      });
      
      console.log('🧠 [MCP] Respuesta de IA:', aiResponse);
      
      // 3. Generar audio de la respuesta (TTS)
      const responseAudio = await services.cartesia.textToSpeech(aiResponse, payload.voiceId);
      
      console.log('🔊 [MCP] Audio generado, enviando respuesta...');
      
      // 4. Enviar audio de respuesta directamente por WebSocket
      // Esto es crítico: el cliente espera recibir audio, no solo texto
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
      
      // También devolver transcript para logs/debugging
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
      // Si el cliente está listo para recibir el saludo inicial
      if (payload.type === 'ready' || payload.message?.includes('listo para recibir saludo')) {
        console.log('👋 [MCP] Cliente listo, cargando saludo inicial GRABADO...');
        
        try {
          // CRÍTICO: Leer archivo de audio GRABADO, NO generar con TTS
          const welcomeAudioPath = path.join(__dirname, 'assets/audio/welcome.mp3');
          
          if (!fs.existsSync(welcomeAudioPath)) {
            console.error('❌ [MCP] ERROR: Archivo de audio grabado no encontrado:', welcomeAudioPath);
            throw new Error('Archivo de audio de bienvenida no encontrado');
          }
          
          // Leer archivo y convertir a base64
          const welcomeAudioBuffer = fs.readFileSync(welcomeAudioPath);
          const welcomeAudio = welcomeAudioBuffer.toString('base64');
          
          const welcomeText = '¡Hola! Soy Sandra. Bienvenido a GuestsValencia. ¿En qué puedo ayudarte hoy?';
          
          console.log('✅ [MCP] Audio grabado cargado:', {
            tamaño: `${(welcomeAudioBuffer.length / 1024).toFixed(2)} KB`,
            formato: 'MP3, 44.1kHz',
            texto: welcomeText
          });
          
          // Enviar saludo inicial directamente por WebSocket con isWelcome: true
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
          
          console.log('✅ [MCP] Saludo inicial GRABADO enviado al cliente (sin latencia de API)');
          
          // No devolver respuesta adicional (ya se envió directamente)
          return null;
        } catch (error) {
          console.error('❌ [MCP] Error cargando audio grabado:', error.message);
          // NO usar fallback a TTS - si falla, es un error crítico
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
      
      // Procesamiento normal de mensajes
      const response = await services.qwen.processMessage(payload.message, {
        context: payload.context,
        role: 'conserje',
        bridgeData: await services.bridgeData.getContext(),
        ambientation: await services.ambientation.getCurrentAmbientation()
      });
      return { response };
    case 'stream':
      // Implement streaming
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
const PORT = process.env.MCP_PORT || 4042;
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
    console.log(`🌐 Health Check: http://${HOST}:${PORT}/health`);
    console.log(`🔗 API Base: http://${HOST}:${PORT}/api`);
    console.log('='.repeat(60));
    console.log('✨ Servidor iniciado y listo para orquestar Sandra IA\n');
  });
}

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Cerrando MCP-SANDRA Server...');
  
  // Crear snapshot final
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

