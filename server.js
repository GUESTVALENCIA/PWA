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
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEBUG_LOG_PATH = path.join(__dirname, '.cursor/debug.log');
const debugLog = (location, message, data, hypothesisId) => {
  try {
    const logEntry = { location, message, data, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId };
    if (!fs.existsSync(path.dirname(DEBUG_LOG_PATH))) fs.mkdirSync(path.dirname(DEBUG_LOG_PATH), { recursive: true });
    fs.appendFileSync(DEBUG_LOG_PATH, JSON.stringify(logEntry) + '\n');
  } catch (e) { }
};
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
import UIControlService from './src/services/ui-control-service.js';
import ToolHandler from './src/websocket/tool-handler.js';
import BridgeDataService from './src/services/bridge-data-service.js';
import PriceCalendarService from './src/services/price-calendar-service.js';
import TwilioService from './src/services/twilio-service.js';
import ToolVerifier from './src/utils/tool-verifier.js';

// 🚀 SANDRA ORCHESTRATOR - Unificación con IA-SANDRA
import SandraOrchestrator from './src/orchestrators/sandra-orchestrator.js';
import NegotiationBridge from './src/orchestrators/negotiation-bridge.js';
import ContextBridge from './src/orchestrators/context-bridge.js';

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
// 🚀 ENTERPRISE: Optimizaciones WebSocket según pipeline Claude
const wss = new WebSocketServer({
  server,
  // CRÍTICO: Deshabilita compresión para latencia mínima (más velocidad)
  perMessageDeflate: false,
  // Límite de payload optimizado para audio streaming
  maxPayload: 100 * 1024, // 100KB
  // Tracking de clientes para gestión de conexiones
  clientTracking: true,
  // Backlog para manejar picos de conexiones simultáneas
  backlog: 100
});

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
let sandraOrchestrator = null;
let negotiationBridge = null;
let contextBridge = null;

// ===== MIDDLEWARE GLOBAL =====
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: ['http://localhost:*', 'http://127.0.0.1:*', 'https://pwa-chi-six.vercel.app', 'https://guestsvalencia.es'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ===== HEALTH CHECK (BEFORE AUTH) =====
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// ===== MIDDLEWARE CUSTOM =====
app.use(authMiddleware);
app.use(projectDetector);
app.use(accessControl);
app.use(rateLimiter);

// ===== API ROUTES =====
app.use('/api/projects', projectRoutes);
app.use('/api', readRoutes);
app.use('/api', proposeRoutes);
app.use('/api', reviewRoutes);
app.use('/api', unifyRoutes);
app.use('/api', implementRoutes);
app.use('/api', contextRoutes);
app.use('/api/voice', voiceIntegrationRoutes);

// ===== ERROR HANDLER (DEBE SER AL FINAL) =====
app.use(errorHandler);

// NOTE: WebSocket initialization is done inside startup() function after all services are initialized

// ===== STARTUP =====
async function startup() {
  try {
    logger.info('🚀 Iniciando MCP Orchestrator...');
    logger.info('📍 Startup function called, initializing services...');

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

    // 5. 🚀 Inicializar SANDRA ORCHESTRATOR (Unificación con IA-SANDRA)
    try {
      logger.info('🚀 Inicializando Sandra Orchestrator...');
      sandraOrchestrator = new SandraOrchestrator({
        sandraRepoPath: process.env.SANDRA_REPO_PATH
      });
      
      const initialized = await sandraOrchestrator.initialize();
      if (initialized) {
        logger.info('✅ Sandra Orchestrator inicializado correctamente');
        
        // Inicializar bridges
        negotiationBridge = new NegotiationBridge(sandraOrchestrator);
        await negotiationBridge.initialize();
        
        contextBridge = new ContextBridge(sandraOrchestrator);
        await contextBridge.initialize();
        
        // Log estado
        const status = sandraOrchestrator.getStatus();
        logger.info('📊 Estado Sandra Orchestrator:', status);
      } else {
        // Comportamiento esperado: sistema funciona sin IA-SANDRA usando servicios del PWA
        logger.debug('Sandra Orchestrator: IA-SANDRA no disponible, usando servicios del PWA (comportamiento esperado)');
      }
    } catch (error) {
      // Solo loguear como error si es un error inesperado (no relacionado con repo no encontrado)
      if (error.message && error.message.includes('no encontrado')) {
        logger.debug('Sandra Orchestrator: IA-SANDRA no disponible, usando servicios del PWA (comportamiento esperado)');
      } else {
        logger.error('❌ Error inicializando Sandra Orchestrator:', error);
      }
    }

    // 6. Inicializar MCP Server
    mcpServer = new MCPServer(projectManager, stateManager);

    // 7. Cargar proyectos
    await projectManager.loadProjects();

    // 8. Hacer servicios disponibles en req.services para las rutas
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
        events: systemEventEmitter,
        // 🚀 SANDRA ORCHESTRATOR - Servicios de IA-SANDRA
        sandra: sandraOrchestrator,
        negotiation: negotiationBridge,
        contextBridge: contextBridge
      };
      next();
    });

    // 9. Inicializar servicios de voz
    let voiceServices = null;
    // #region agent log
    debugLog('server.js:168', 'Starting voice services initialization', { step: 'before_import' }, 'A');
    // #endregion
    try {
      const voiceServicesModule = await import('./src/services/voice-services.js');
      // #region agent log
      debugLog('server.js:171', 'After import', { hasModule: !!voiceServicesModule, hasDefault: !!voiceServicesModule.default, defaultKeys: voiceServicesModule.default ? Object.keys(voiceServicesModule.default) : [] }, 'B');
      // #endregion
      voiceServices = voiceServicesModule.default;
      // #region agent log
      debugLog('server.js:172', 'After assigning default', { hasVoiceServices: !!voiceServices, keys: voiceServices ? Object.keys(voiceServices) : [], hasDeepgram: !!voiceServices?.deepgram, hasGenerateVoice: !!voiceServices?.generateVoice, hasAI: !!voiceServices?.ai, hasWelcomeAudio: !!voiceServices?.getWelcomeAudio }, 'B');
      // #endregion

      // Validate service structure
      if (!voiceServices) {
        throw new Error('Voice services module returned null/undefined');
      }

      // Log the actual structure for debugging
      logger.info('Voice services module structure:', {
        hasDefault: !!voiceServicesModule.default,
        hasDeepgram: !!voiceServices?.deepgram,
        hasNativeVoice: !!voiceServices?.generateVoice, // Native voice service (not Cartesia API)
        hasAI: !!voiceServices?.ai,
        hasWelcomeAudio: !!voiceServices?.getWelcomeAudio,
        keys: Object.keys(voiceServices || {})
      });

      // Verify required API keys are present (services will check internally)
      // Groq is required (primary), OpenAI is optional (fallback)
      // Cartesia removed - using native local voice instead
      const requiredKeys = ['DEEPGRAM_API_KEY', 'GROQ_API_KEY'];
      const missingKeys = requiredKeys.filter(key => !process.env[key]);
      if (missingKeys.length > 0) {
        logger.warn(`⚠️ Missing API keys: ${missingKeys.join(', ')}`);
      }
      if (!process.env.OPENAI_API_KEY) {
        logger.warn('⚠️ OpenAI API key not found - Groq will be used without fallback');
      }
      logger.info('✅ Using native local voice (no Cartesia TTS latency)');

      // Verificar que los servicios estén disponibles
      // Note: Cartesia removed - using native local voice (generateVoice) instead
      if (voiceServices && voiceServices.deepgram && voiceServices.generateVoice && voiceServices.ai && voiceServices.getWelcomeAudio) {
        logger.info('✅ Voice services initialized successfully', {
          hasDeepgram: !!voiceServices.deepgram,
          hasNativeVoice: !!voiceServices.generateVoice, // Native voice service (not Cartesia API)
          hasAI: !!voiceServices.ai,
          hasWelcomeAudio: !!voiceServices.getWelcomeAudio,
          deepgramMethods: voiceServices.deepgram ? Object.keys(voiceServices.deepgram) : [],
          aiMethods: voiceServices.ai ? Object.keys(voiceServices.ai) : []
        });
      } else {
        // #region agent log
        debugLog('server.js:212', 'Voice services structure incomplete - throwing error', { hasVoiceServices: !!voiceServices, hasDeepgram: !!voiceServices?.deepgram, hasGenerateVoice: !!voiceServices?.generateVoice, hasAI: !!voiceServices?.ai, hasWelcomeAudio: !!voiceServices?.getWelcomeAudio, structure: JSON.stringify(voiceServices).substring(0, 300) }, 'C');
        // #endregion
        logger.error('❌ Voice services partially initialized - missing required services', {
          hasVoiceServices: !!voiceServices,
          hasDeepgram: !!voiceServices?.deepgram,
          hasNativeVoice: !!voiceServices?.generateVoice, // Native voice service (not Cartesia API)
          hasAI: !!voiceServices?.ai,
          hasWelcomeAudio: !!voiceServices?.getWelcomeAudio,
          structure: JSON.stringify(voiceServices, null, 2).substring(0, 500)
        });
        throw new Error('Voice services structure incomplete');
      }
    } catch (error) {
      // #region agent log
      debugLog('server.js:223', 'Voice services initialization FAILED', { errorMessage: error.message, errorStack: error.stack?.substring(0, 200), willSetNull: true }, 'A');
      // #endregion
      logger.error('❌ Voice services initialization failed:', error);
      logger.error('Error details:', {
        message: error.message,
        stack: error.stack?.substring(0, 500),
        code: error.code
      });
      voiceServices = null; // Ensure it's null on error
      // #region agent log
      debugLog('server.js:230', 'Voice services set to null after error', { voiceServicesIsNull: voiceServices === null }, 'A');
      // #endregion
    }

    // 9. Inicializar servicios de UI y Tools
    const uiControlService = new UIControlService();
    logger.info('✅ UIControlService inicializado');
    
    // 🚀 FASE 3: Inicializar servicios de precios y disponibilidad
    const bridgeDataService = new BridgeDataService(neonService);
    const priceCalendarService = new PriceCalendarService(neonService);
    logger.info('✅ BridgeDataService y PriceCalendarService inicializados');
    
    // 🚀 FASE 4: Inicializar servicio de Twilio
    const twilioService = new TwilioService();
    if (twilioService.isAvailable()) {
      logger.info('✅ TwilioService inicializado y configurado');
    } else {
      logger.warn('⚠️ TwilioService no disponible (credenciales no configuradas)');
    }
    
    // Preparar servicios para ToolHandler
    const toolServices = {
      neonService: neonService,
      uiControlService: uiControlService,
      sandraOrchestrator: sandraOrchestrator,
      negotiationBridge: negotiationBridge,
      contextBridge: contextBridge,
      bridgeDataService: bridgeDataService,
      priceCalendarService: priceCalendarService,
      twilioService: twilioService
    };
    
    // Inicializar ToolHandler
    const toolHandler = new ToolHandler(toolServices);
    logger.info('✅ Tool Handler y UI Control Service inicializados');
    
    // 🚀 FASE 6: Verificación completa del sistema
    const toolVerifier = new ToolVerifier(toolHandler);
    const verificationResults = toolVerifier.verifyComplete();
    logger.info(`[VERIFICATION] 📊 Sistema verificado: ${verificationResults.status.toUpperCase()}`);
    if (verificationResults.tools.total > 0) {
      logger.info(`[VERIFICATION] ✅ ${verificationResults.tools.total} tools registradas y verificadas`);
    }

    // 10. Inicializar WebSocket con servicios (después de que todos los servicios estén listos)
    // #region agent log
    debugLog('server.js:235', 'Before initWebSocketServer call', { voiceServicesIsNull: voiceServices === null, hasVoiceServices: !!voiceServices, willPassToInit: true }, 'E');
    // #endregion
    logger.info('Initializing WebSocket server with all services...');
    initWebSocketServer(wss, stateManager, systemEventEmitter, neonService, voiceServices, toolHandler, uiControlService);
    logger.info('✅ WebSocket server initialized');

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
logger.info('📍 Starting server initialization...');
startup().catch((error) => {
  logger.error('❌ Fatal error during startup:', error);
  process.exit(1);
});

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
