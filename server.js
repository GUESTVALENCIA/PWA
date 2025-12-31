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
import { SystemEventEmitter } from './src/core/event-emitter.js';
import { initWebSocketServer } from './src/websocket/socket-server.js';
import logger from './src/utils/logger.js';
import authMiddleware from './src/middleware/auth.js';
import projectDetector from './src/middleware/project-detector.js';
import accessControl from './src/middleware/access-control.js';
import rateLimiter from './src/middleware/rate-limiter.js';
import errorHandler from './src/middleware/error-handler.js';

// Services
import NeonService from './src/services/neon-service.js';
import ProposalService from './src/services/proposal-service.js';
import ReviewService from './src/services/review-service.js';
import UnificationService from './src/services/unification-service.js';
import ImplementationService from './src/services/implementation-service.js';
import ContextBuilder from './src/services/context-builder.js';

// ===== IMPORTS RUTAS =====
import projectRoutes from './src/routes/projects.js';
import readRoutes from './src/routes/read.js';
import proposeRoutes from './src/routes/propose.js';
import reviewRoutes from './src/routes/review.js';
import unifyRoutes from './src/routes/unify.js';
import implementRoutes from './src/routes/implement.js';
import contextRoutes from './src/routes/context.js';
import voiceIntegrationRoutes from './src/routes/voice-integration.js';

// ===== INICIALIZACIÓN =====
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// ===== ESTADO GLOBAL =====
let mcpServer = null;
let projectManager = null;
let stateManager = null;
let systemEventEmitter = null;
let neonService = null;
let proposalService = null;
let reviewService = null;
let unificationService = null;
let implementationService = null;
let contextBuilder = null;

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
app.use('/api/voice', voiceIntegrationRoutes);

// ===== WEBSOCKET =====
initWebSocketServer(wss, stateManager);

// ===== ERROR HANDLER (DEBE SER AL FINAL) =====
app.use(errorHandler);

// ===== STARTUP =====
async function startup() {
  try {
    logger.info('🚀 Iniciando MCP Orchestrator...');

    // 1. Inicializar evento emitter
    systemEventEmitter = new SystemEventEmitter();

    // 2. Inicializar estado base
    stateManager = new StateManager();
    projectManager = new ProjectManager(stateManager);

    // 3. Inicializar NEON Database
    if (!process.env.NEON_DATABASE_URL) {
      logger.warn('⚠️ NEON_DATABASE_URL not configured. Using in-memory database only.');
      neonService = null;
    } else {
      neonService = new NeonService(process.env.NEON_DATABASE_URL);
      try {
        await neonService.initialize();
        logger.info('✅ NEON Database initialized');
      } catch (dbError) {
        logger.warn('⚠️ NEON Database initialization failed. Using fallback:', dbError.message);
        // Continue with in-memory fallback
      }
    }

    // 4. Inicializar servicios
    proposalService = new ProposalService(neonService, stateManager, systemEventEmitter);
    reviewService = new ReviewService(neonService, stateManager, systemEventEmitter);
    unificationService = new UnificationService(neonService, proposalService, reviewService, systemEventEmitter);
    implementationService = new ImplementationService(neonService, systemEventEmitter, projectManager);
    contextBuilder = new ContextBuilder(neonService);

    // 5. Inicializar MCP Server
    mcpServer = new MCPServer(projectManager, stateManager);

    // 6. Cargar proyectos
    await projectManager.loadProjects();

    // 7. Hacer servicios disponibles en req.services para las rutas
    app.use((req, res, next) => {
      req.services = {
        proposal: proposalService,
        review: reviewService,
        unification: unificationService,
        implementation: implementationService,
        context: contextBuilder,
        neon: neonService,
        project: projectManager,
        state: stateManager,
        events: systemEventEmitter
      };
      next();
    });

    // 8. Inicializar servicios de voz
    let voiceServices = null;
    try {
      const voiceServicesModule = await import('./src/services/voice-services.js');
      voiceServices = voiceServicesModule.default;
      
      // Verificar que los servicios estén disponibles
      if (voiceServices && voiceServices.deepgram && voiceServices.cartesia && voiceServices.ai) {
        logger.info('✅ Voice services initialized', {
          hasDeepgram: !!voiceServices.deepgram,
          hasCartesia: !!voiceServices.cartesia,
          hasAI: !!voiceServices.ai
        });
      } else {
        logger.warn('⚠️ Voice services partially initialized', {
          hasDeepgram: !!voiceServices?.deepgram,
          hasCartesia: !!voiceServices?.cartesia,
          hasAI: !!voiceServices?.ai
        });
      }
    } catch (error) {
      logger.warn('⚠️ Voice services not available:', error.message);
      logger.error('Voice services initialization error:', error);
    }

    // 9. Inicializar WebSocket con servicios
    initWebSocketServer(wss, stateManager, systemEventEmitter, neonService, voiceServices);

    // 10. Iniciar servidor HTTP
    server.listen(PORT, HOST, () => {
      logger.info(`✅ MCP Server running on http://${HOST}:${PORT}`);
      logger.info(`📡 WebSocket on ws://${HOST}:${PORT}`);
      logger.info(`🗄️ NEON Database: ${neonService ? 'Connected' : 'Fallback mode'}`);
      logger.info(`🔧 Services initialized: ${neonService ? 'All' : 'Core only'}`);
    });

  } catch (error) {
    logger.error('❌ Error during startup:', error);
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

export {
  app,
  server,
  wss,
  mcpServer,
  projectManager,
  stateManager,
  systemEventEmitter,
  neonService,
  proposalService,
  reviewService,
  unificationService,
  implementationService,
  contextBuilder
};
