/**
 * MCP ORCHESTRATOR - Servidor Principal
 * Sistema de orquestación multi-agente IA
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import http from 'http';

dotenv.config();

// ===== IMPORTS INTERNOS =====
import { MCPServer } from './src/core/mcp-server.js';
import { ProjectManager } from './src/core/project-manager.js';
import { StateManager } from './src/core/state-manager.js';
import { initWebSocketServer } from './src/websocket/socket-server.js';
import { logger } from './src/utils/logger.js';
import authMiddleware from './src/middleware/auth.js';
import { projectDetector } from './src/middleware/project-detector.js';
import { accessControl } from './src/middleware/access-control.js';
import { rateLimiter } from './src/middleware/rate-limiter.js';
import { errorHandler } from './src/middleware/error-handler.js';

// ===== IMPORTS RUTAS =====
import projectRoutes from './src/routes/projects.js';
import readRoutes from './src/routes/read.js';
import proposeRoutes from './src/routes/propose.js';
import reviewRoutes from './src/routes/review.js';
import unifyRoutes from './src/routes/unify.js';
import implementRoutes from './src/routes/implement.js';
import contextRoutes from './src/routes/context.js';

// ===== INICIALIZACIÓN =====
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// ===== ESTADO GLOBAL =====
let mcpServer = null;
let projectManager = null;
let stateManager = null;

// ===== MIDDLEWARE GLOBAL =====
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: ['http://localhost:*', 'http://127.0.0.1:*'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ===== MIDDLEWARE CUSTOM =====
app.use(authMiddleware);
app.use(projectDetector);
app.use(accessControl);
app.use(rateLimiter);

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// ===== API ROUTES =====
app.use('/api/projects', projectRoutes);
app.use('/api', readRoutes);
app.use('/api', proposeRoutes);
app.use('/api', reviewRoutes);
app.use('/api', unifyRoutes);
app.use('/api', implementRoutes);
app.use('/api', contextRoutes);

// ===== WEBSOCKET =====
initWebSocketServer(wss, stateManager);

// ===== ERROR HANDLER (DEBE SER AL FINAL) =====
app.use(errorHandler);

// ===== STARTUP =====
async function startup() {
  try {
    logger.info('🚀 Iniciando MCP Orchestrator...');

    // Inicializar servicios
    stateManager = new StateManager();
    projectManager = new ProjectManager(stateManager);
    mcpServer = new MCPServer(projectManager, stateManager);

    // Cargar proyectos
    await projectManager.loadProjects();

    // Iniciar servidor
    server.listen(PORT, HOST, () => {
      logger.info(`✅ MCP Server running on http://${HOST}:${PORT}`);
      logger.info(`📡 WebSocket on ws://${HOST}:${process.env.WS_PORT || 3001}`);
      logger.info(`🗄️ NEON Database: ${process.env.NEON_DATABASE_URL ? 'Conectado' : 'No configurado'}`);
    });

  } catch (error) {
    logger.error('❌ Error durante startup:', error);
    process.exit(1);
  }
}

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', async () => {
  logger.info('📴 Recibido SIGTERM, apagando gracefully...');
  server.close(() => {
    logger.info('✅ Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('📴 Recibido SIGINT, apagando gracefully...');
  server.close(() => {
    logger.info('✅ Servidor cerrado');
    process.exit(0);
  });
});

// ===== INICIAR =====
startup();

export { app, server, wss, mcpServer, projectManager, stateManager };
