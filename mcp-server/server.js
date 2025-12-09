/**
 * MCP Server - Model Context Protocol
 * Orquestador central para Sandra IA
 * 
 * Servicios:
 * - /chat: Interfaz de texto (DeepSeek R1 + Qwen)
 * - /voice: TTS/STT + Orquestador de Audio (Cartesia + Qwen Audio)
 * - /vision: Entrada visual + tareas multimodales (Qwen VL)
 * - /commands: Ejecución de funciones & control (Qwen Code Interpreter)
 * - /scheduler: Alarmas, snapshots, restauraciones
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const ChatService = require('./services/chat');
const VoiceService = require('./services/voice');
const VisionService = require('./services/vision');
const CommandsService = require('./services/commands');
const SchedulerService = require('./services/scheduler');
const MCPRouter = require('./router/mcp-router');
const PublicAPIsIndexer = require('./utils/public-apis-indexer');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// WebSocket Server
const wss = new WebSocket.Server({ server });

// Initialize Services
const chatService = new ChatService();
const voiceService = new VoiceService();
const visionService = new VisionService();
const commandsService = new CommandsService();
const schedulerService = new SchedulerService();
const publicAPIsIndexer = new PublicAPIsIndexer();

// Load Public APIs Index
publicAPIsIndexer.loadIndex().catch(console.warn);

// MCP Router
const mcpRouter = new MCPRouter({
  chatService,
  voiceService,
  visionService,
  commandsService,
  schedulerService
});

// Routes
app.use('/mcp-router', mcpRouter.router);

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      chat: chatService.isReady(),
      voice: voiceService.isReady(),
      vision: visionService.isReady(),
      commands: commandsService.isReady(),
      scheduler: schedulerService.isReady()
    }
  });
});

// WebSocket Connection Handler
wss.on('connection', (ws, req) => {
  console.log('🔌 Nueva conexión WebSocket MCP');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      const { service, action, payload } = data;
      
      // Route to appropriate service
      let response;
      switch (service) {
        case 'chat':
          response = await chatService.handleWebSocket(action, payload, ws);
          break;
        case 'voice':
          response = await voiceService.handleWebSocket(action, payload, ws);
          break;
        case 'vision':
          response = await visionService.handleWebSocket(action, payload, ws);
          break;
        case 'commands':
          response = await commandsService.handleWebSocket(action, payload, ws);
          break;
        default:
          response = { error: 'Unknown service', service };
      }
      
      if (response) {
        ws.send(JSON.stringify(response));
      }
    } catch (error) {
      console.error('Error procesando mensaje WebSocket:', error);
      ws.send(JSON.stringify({ error: error.message }));
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 Conexión WebSocket cerrada');
  });
  
  ws.on('error', (error) => {
    console.error('Error en WebSocket:', error);
  });
});

// Start Server
const PORT = process.env.MCP_PORT || 4042;
const HOST = process.env.MCP_HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🚀 MCP Server iniciado en ${HOST}:${PORT}`);
  console.log(`📡 WebSocket disponible en ws://${HOST}:${PORT}`);
  console.log(`🌐 REST API disponible en http://${HOST}:${PORT}`);
  console.log(`🔗 Gateway: http://${HOST}:${PORT}/mcp-router`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Cerrando MCP Server...');
  server.close(() => {
    console.log('✅ MCP Server cerrado');
    process.exit(0);
  });
});

module.exports = { app, server, wss };

