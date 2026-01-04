/**
 * WebSocket Server for Real-Time Synchronization
 * Handles agent connections and broadcasts state changes
 */

import { WebSocket } from 'ws';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import IPGeolocationService from '../services/ip-geolocation-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEBUG_LOG_PATH = path.join(__dirname, '../../.cursor/debug.log');

// Inicializar servicio de geolocalización IP
const ipGeolocationService = new IPGeolocationService();
const debugLog = (location, message, data, hypothesisId) => {
  try {
    const logEntry = { location, message, data, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId };
    if (!fs.existsSync(path.dirname(DEBUG_LOG_PATH))) fs.mkdirSync(path.dirname(DEBUG_LOG_PATH), { recursive: true });
    fs.appendFileSync(DEBUG_LOG_PATH, JSON.stringify(logEntry) + '\n');
  } catch (e) { }
};

// Active agent subscriptions: Map<agentId, Set<projectIds>>
const agentSubscriptions = new Map();
// Agent WebSocket connections: Map<agentId, ws>
const agentConnections = new Map();
// Deepgram streaming connections: Map<agentId, { connection, isProcessing, greetingSent }>
const deepgramConnections = new Map();
// 🚀 GPT-4o: Mapa de sesiones por sessionId para mantener estado entre reconexiones
const sessionMap = new Map(); // Map<sessionId, { agentId, greetingSent, lastFinalizedTranscript, lastAIResponse, createdAt, lastUpdatedAt, lastReconnectedAt }>
// Voice Agent connections: Map<agentId, { agent, isProcessing }>
const voiceAgentConnections = new Map();
// Track agents where STT is not available (prevents error spam)
const sttUnavailableAgents = new Set();
// Track agents where STT errors already reported (prevents error spam)
const sttErrorAgents = new Set();

/**
 * Initialize WebSocket server
 * @param {WebSocketServer} wss - WebSocket server instance
 * @param {StateManager} stateManager - State manager instance
 * @param {SystemEventEmitter} systemEventEmitter - Event emitter instance
 * @param {NeonService} neonService - Neon database service
 * @param {Object} voiceServices - Legacy voice services (deprecated - using VoiceAgentService)
 */
// Socket Server - Full Duplex Optimized v1.1

export function initWebSocketServer(wss, stateManager, systemEventEmitter, neonService, voiceServices = null, toolHandler = null, uiControlService = null) {
  // #region agent log
  debugLog('socket-server.js:18', 'initWebSocketServer called', { voiceServicesIsNull: voiceServices === null, hasVoiceServices: !!voiceServices, hasDeepgram: !!voiceServices?.deepgram, hasAI: !!voiceServices?.ai, hasWelcomeAudio: !!voiceServices?.getWelcomeAudio }, 'E');
  // #endregion
	  wss.on('connection', async (ws, req) => {
	    const agentId = req.headers['x-agent-id'] || `agent_${Math.random().toString(36).substring(7)}`;
	    const connectionTime = new Date().toISOString();
		    const sttAvailable = voiceServices?.deepgram?.isConfigured === true;

    // 🚀 MEMORIA PERSISTENTE: Capturar IP y obtener geolocalización
    const ipAddress = ipGeolocationService.extractIPFromRequest(req);
    let geolocationData = null;
    
    try {
      geolocationData = await ipGeolocationService.getLocationFromIP(ipAddress);
      logger.info(`[MEMORIA PERSISTENTE] 📍 IP ${ipAddress} → ${geolocationData.city}, ${geolocationData.country} (${geolocationData.timezone})`);
    } catch (error) {
      logger.warn(`[MEMORIA PERSISTENTE] ⚠️ Error obteniendo geolocalización:`, error);
      geolocationData = {
        country: 'ES',
        city: 'Valencia',
        timezone: 'Europe/Madrid',
        language: 'es'
      };
    }

    logger.info(`✅ WebSocket connected: ${agentId} (IP: ${ipAddress})`);

    // Register agent connection
    agentConnections.set(agentId, ws);
    if (!agentSubscriptions.has(agentId)) {
      agentSubscriptions.set(agentId, new Set());
    }

    // Send welcome message
	    ws.send(JSON.stringify({
	      type: 'connection_established',
	      agent_id: agentId,
	      timestamp: connectionTime,
	      message: 'Connected to MCP Orchestrator',
	      capabilities: {
	        stt: sttAvailable
	      }
	    }));

    // 🚀 WEBRTC PIPELINE: NO enviar saludo automáticamente
    // El saludo se enviará DESPUÉS de que el cliente reproduzca los ringtones
    // El cliente enviará mensaje "ready" después de los ringtones, entonces enviaremos el saludo
    logger.info(`[WEBSOCKET] Conexión establecida para ${agentId} - esperando ringtones del cliente antes de enviar saludo`);

    // 🚀 MEMORIA PERSISTENTE: Almacenar información de IP y geolocalización en el WebSocket
    ws._callContext = {
      agentId,
      ipAddress,
      geolocationData,
      callId: `call_${Date.now()}_${agentId}`,
      sessionId: null // Se establecerá cuando se reciba sessionId del cliente
    };

    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        handleMessage(data, agentId, ws, wss, neonService, systemEventEmitter, voiceServices, toolHandler, uiControlService);
      } catch (error) {
        logger.error('WebSocket message parsing error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Invalid message format',
          details: error.message
        }));
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      logger.info(`🔴 WebSocket disconnected: ${agentId}`);
      
      // Close Deepgram streaming connection if exists (legacy)
      const deepgramData = deepgramConnections.get(agentId);
	      if (deepgramData && deepgramData.connection) {
        logger.info(`[DEEPGRAM] Closing streaming connection for ${agentId}`);
        try {
          deepgramData.connection.finish();
        } catch (error) {
          logger.error(`[DEEPGRAM] Error closing connection:`, error);
        }
	        deepgramConnections.delete(agentId);
	      }

	      sttUnavailableAgents.delete(agentId);
	      sttErrorAgents.delete(agentId);
	      
	      agentConnections.delete(agentId);
	      agentSubscriptions.delete(agentId);

      // Notify other agents of disconnection
      broadcastToAll(wss, {
        type: 'agent_disconnected',
        agent_id: agentId,
        timestamp: new Date().toISOString()
      }, agentId);
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error(`WebSocket error for ${agentId}:`, error);
    });

    // Setup heartbeat
    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === 1) { // 1 = OPEN
        ws.ping();
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000); // Every 30 seconds
  });

  // Listen for system events and broadcast
  if (systemEventEmitter) {
    systemEventEmitter.on('project:registered', (projectId) => {
      broadcastToProjectSubscribers(wss, projectId, {
        type: 'project_created',
        project_id: projectId,
        timestamp: new Date().toISOString()
      });
    });

    systemEventEmitter.on('proposal:created', (projectId, proposalId) => {
      broadcastToProjectSubscribers(wss, projectId, {
        type: 'proposal_created',
        proposal_id: proposalId,
        timestamp: new Date().toISOString()
      });
    });

    systemEventEmitter.on('review:created', (projectId, proposalId) => {
      broadcastToProjectSubscribers(wss, projectId, {
        type: 'review_created',
        proposal_id: proposalId,
        timestamp: new Date().toISOString()
      });
    });

    systemEventEmitter.on('plan:created', (projectId, planId) => {
      broadcastToProjectSubscribers(wss, projectId, {
        type: 'plan_created',
        plan_id: planId,
        timestamp: new Date().toISOString()
      });
    });

    systemEventEmitter.on('plan:approved', (projectId, planId) => {
      broadcastToProjectSubscribers(wss, projectId, {
        type: 'plan_approved',
        plan_id: planId,
        timestamp: new Date().toISOString()
      });
    });

    systemEventEmitter.on('implementation:started', (projectId, planId, agentId) => {
      broadcastToProjectSubscribers(wss, projectId, {
        type: 'implementation_started',
        plan_id: planId,
        agent_id: agentId,
        project_locked: true,
        timestamp: new Date().toISOString()
      });
    });

    systemEventEmitter.on('implementation:completed', (projectId, planId, agentId) => {
      broadcastToProjectSubscribers(wss, projectId, {
        type: 'implementation_completed',
        plan_id: planId,
        agent_id: agentId,
        project_locked: false,
        timestamp: new Date().toISOString()
      });
    });

    systemEventEmitter.on('implementation:failed', (projectId, planId, agentId) => {
      broadcastToProjectSubscribers(wss, projectId, {
        type: 'implementation_failed',
        plan_id: planId,
        agent_id: agentId,
        project_locked: false,
        timestamp: new Date().toISOString()
      });
    });
  }
}

/**
 * Handle incoming WebSocket message
 */
function handleMessage(data, agentId, ws, wss, neonService, systemEventEmitter, voiceServices, toolHandler = null, uiControlService = null) {
  // Soporte para formato route/action (sistema de voz)
  if (data.route && data.action) {
    handleVoiceMessage(data, agentId, ws, voiceServices, toolHandler, uiControlService).catch(error => {
      logger.error('Error in handleVoiceMessage:', error);
    });
    return;
  }
  
  // Formato existente type/payload (orquestación)
  const { type, payload } = data;

  switch (type) {
    case 'subscribe_project':
      handleSubscribeProject(agentId, payload, ws);
      break;

    case 'unsubscribe_project':
      handleUnsubscribeProject(agentId, payload, ws);
      break;

    case 'get_project_status':
      handleGetProjectStatus(agentId, payload, ws, neonService);
      break;

    case 'request_sync':
      handleRequestSync(agentId, payload, ws, neonService);
      break;

    case 'heartbeat':
    case 'ping':
      // Respond to heartbeat
      ws.send(JSON.stringify({
        type: 'pong',
        timestamp: new Date().toISOString()
      }));
      break;

    case 'get_active_agents':
      handleGetActiveAgents(agentId, ws);
      break;

    case 'list_subscriptions':
      handleListSubscriptions(agentId, ws);
      break;

    default:
      logger.warn(`Unknown WebSocket message type: ${type}`);
      ws.send(JSON.stringify({
        type: 'error',
        error: `Unknown message type: ${type}`
      }));
  }
}

/**
 * Subscribe agent to project updates
 */
function handleSubscribeProject(agentId, payload, ws) {
  const { projectId } = payload;

  if (!projectId) {
    ws.send(JSON.stringify({
      type: 'error',
      error: 'projectId is required'
    }));
    return;
  }

  const subscriptions = agentSubscriptions.get(agentId) || new Set();
  subscriptions.add(projectId);
  agentSubscriptions.set(agentId, subscriptions);

  logger.info(`📢 Agent ${agentId} subscribed to project ${projectId}`);

  ws.send(JSON.stringify({
    type: 'subscription_confirmed',
    project_id: projectId,
    timestamp: new Date().toISOString()
  }));
}

/**
 * Unsubscribe agent from project updates
 */
function handleUnsubscribeProject(agentId, payload, ws) {
  const { projectId } = payload;

  if (!projectId) {
    ws.send(JSON.stringify({
      type: 'error',
      error: 'projectId is required'
    }));
    return;
  }

  const subscriptions = agentSubscriptions.get(agentId);
  if (subscriptions) {
    subscriptions.delete(projectId);
  }

  logger.info(`📵 Agent ${agentId} unsubscribed from project ${projectId}`);

  ws.send(JSON.stringify({
    type: 'unsubscription_confirmed',
    project_id: projectId,
    timestamp: new Date().toISOString()
  }));
}

/**
 * Get project status
 */
async function handleGetProjectStatus(agentId, payload, ws, neonService) {
  const { projectId } = payload;

  if (!projectId || !neonService) {
    ws.send(JSON.stringify({
      type: 'error',
      error: 'projectId is required and database not available'
    }));
    return;
  }

  try {
    const project = await neonService.getProject(projectId);
    const proposals = await neonService.getProjectProposals(projectId);
    const plans = await neonService.getProjectPlans(projectId);

    ws.send(JSON.stringify({
      type: 'project_status',
      project_id: projectId,
      status: {
        lock_status: project.lock_status,
        proposals_count: proposals.length,
        plans_count: plans.length,
        timestamp: new Date().toISOString()
      }
    }));
  } catch (error) {
    logger.error('Failed to get project status:', error);
    ws.send(JSON.stringify({
      type: 'error',
      error: 'Failed to get project status'
    }));
  }
}

/**
 * Request sync for a project
 */
async function handleRequestSync(agentId, payload, ws, neonService) {
  const { projectId } = payload;

  if (!projectId || !neonService) {
    ws.send(JSON.stringify({
      type: 'error',
      error: 'projectId is required and database not available'
    }));
    return;
  }

  try {
    const project = await neonService.getProject(projectId);
    const lockStatus = await neonService.checkProjectLock(projectId);
    const pendingProposals = await neonService.getProjectProposals(projectId, 'pending');
    const approvedPlans = await neonService.getProjectPlans(projectId, 'approved');

    ws.send(JSON.stringify({
      type: 'sync_data',
      project_id: projectId,
      data: {
        lock_status: lockStatus?.lock_status || 'unlocked',
        locked_by: lockStatus?.locked_by || null,
        pending_proposals: pendingProposals.length,
        approved_plans: approvedPlans.length,
        timestamp: new Date().toISOString()
      }
    }));
  } catch (error) {
    logger.error('Failed to sync data:', error);
    ws.send(JSON.stringify({
      type: 'error',
      error: 'Failed to sync data'
    }));
  }
}

/**
 * Get list of active agents
 */
function handleGetActiveAgents(agentId, ws) {
  const agents = Array.from(agentConnections.keys());

  ws.send(JSON.stringify({
    type: 'active_agents',
    agents: agents,
    count: agents.length,
    timestamp: new Date().toISOString()
  }));
}

/**
 * List agent's subscriptions
 */
function handleListSubscriptions(agentId, ws) {
  const subscriptions = Array.from(agentSubscriptions.get(agentId) || []);

  ws.send(JSON.stringify({
    type: 'subscriptions',
    projects: subscriptions,
    count: subscriptions.length,
    timestamp: new Date().toISOString()
  }));
}

/**
 * Broadcast message to all agents
 */
function broadcastToAll(wss, message, excludeAgentId = null) {
  const payload = JSON.stringify(message);

  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // 1 = OPEN
      // Check if we should exclude this client
      for (const [agentId, ws] of agentConnections.entries()) {
        if (ws === client && agentId === excludeAgentId) {
          return;
        }
        if (ws === client) {
          client.send(payload);
          return;
        }
      }
    }
  });
}

/**
 * Broadcast message to agents subscribed to a specific project
 */
function broadcastToProjectSubscribers(wss, projectId, message) {
  const payload = JSON.stringify(message);

  for (const [agentId, projectSet] of agentSubscriptions.entries()) {
    if (projectSet.has(projectId)) {
      const ws = agentConnections.get(agentId);
      if (ws && ws.readyState === 1) { // 1 = OPEN
        ws.send(payload);
      }
    }
  }
}

/**
 * Handle voice system messages (route/action format)
 */
async function handleVoiceMessage(data, agentId, ws, voiceServices, toolHandler = null, uiControlService = null) {
  const { route, action, payload } = data;

  // #region agent log
  debugLog('socket-server.js:430', 'handleVoiceMessage called', { route, action, voiceServicesIsNull: voiceServices === null, hasVoiceServices: !!voiceServices, hasDeepgram: !!voiceServices?.deepgram, hasAI: !!voiceServices?.ai, hasWelcomeAudio: !!voiceServices?.getWelcomeAudio, voiceServicesKeys: voiceServices ? Object.keys(voiceServices) : [] }, 'D');
  // #endregion

  if (!voiceServices) {
    // #region agent log
    debugLog('socket-server.js:433', 'Voice services is NULL - sending error', { route, action }, 'A');
    // #endregion
    logger.warn('Voice services not available');
    ws.send(JSON.stringify({
      route: 'error',
      action: 'message',
      payload: {
        error: 'Voice services not configured',
        message: 'Voice system is not available on this server'
      }
    }));
    return;
  }

  // Verificar que los servicios estén disponibles
  // 🚀 ENTERPRISE: Solo requerir deepgram y AI - getWelcomeAudio ya no se usa (todo con Deepgram TTS)
  if (!voiceServices.deepgram || !voiceServices.ai || !voiceServices.generateVoice) {
    // #region agent log
    debugLog('socket-server.js:469', 'Voice services missing required properties', { hasDeepgram: !!voiceServices.deepgram, hasAI: !!voiceServices.ai, hasWelcomeAudio: !!voiceServices.getWelcomeAudio, hasGenerateVoice: !!voiceServices.generateVoice, allKeys: voiceServices ? Object.keys(voiceServices) : [], voiceServicesType: typeof voiceServices }, 'C');
    // #endregion
    logger.warn('Voice services not fully initialized', {
      hasDeepgram: !!voiceServices.deepgram,
      hasAI: !!voiceServices.ai,
      hasGenerateVoice: !!voiceServices.generateVoice,
      allKeys: voiceServices ? Object.keys(voiceServices) : [],
      voiceServicesType: typeof voiceServices
    });
    ws.send(JSON.stringify({
      route: 'error',
      action: 'message',
      payload: {
        error: 'Voice services not configured',
        message: 'Voice system is not available on this server'
      }
    }));
    return;
  }
  
  // #region agent log
  debugLog('socket-server.js:490', 'Voice services validation PASSED', { hasDeepgram: !!voiceServices.deepgram, hasAI: !!voiceServices.ai, hasWelcomeAudio: !!voiceServices.getWelcomeAudio, hasGenerateVoice: !!voiceServices.generateVoice }, 'D');
  // #endregion

  try {
    switch (route) {
      case 'audio':
        if (action === 'stt') {
          // 🚫 VOICE AGENT API DESHABILITADO - Usar sistema legacy que funciona
          await handleAudioSTT(payload, ws, voiceServices, agentId);
        } else if (action === 'tts') {
          await handleAudioTTS(payload, ws, voiceServices);
        } else {
          ws.send(JSON.stringify({
            route: 'error',
            action: 'message',
            payload: { error: `Unknown audio action: ${action}` }
          }));
        }
        break;

      case 'conserje':
        if (action === 'message' && payload?.type === 'ready') {
          // 🚀 MEMORIA PERSISTENTE: Crear call log en el stream cuando se recibe "ready"
          const callContext = ws._callContext || {};
          const sessionId = payload.sessionId || callContext.sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          
          // Actualizar sessionId en el contexto
          callContext.sessionId = sessionId;
          ws._callContext = callContext;
          
          // Crear call log en NEON
          if (neonService && callContext.ipAddress) {
            neonService.createOrUpdateCallLog({
              callId: callContext.callId,
              sessionId: sessionId,
              agentId: agentId,
              ipAddress: callContext.ipAddress,
              country: callContext.geolocationData?.country,
              city: callContext.geolocationData?.city,
              timezone: callContext.geolocationData?.timezone,
              language: callContext.geolocationData?.language || 'es'
            }).then(callLog => {
              if (callLog) {
                logger.info(`[MEMORIA PERSISTENTE] ✅ Call log creado: ${callLog.call_id} (IP: ${callContext.ipAddress})`);
                
                // Cargar historial previo si existe
                if (callContext.ipAddress) {
                  neonService.getCallHistoryByIP(callContext.ipAddress, 1).then(previousCalls => {
                    if (previousCalls && previousCalls.length > 0) {
                      const lastCall = previousCalls[0];
                      logger.info(`[MEMORIA PERSISTENTE] 📋 Historial previo encontrado para IP ${callContext.ipAddress}: ${lastCall.conversation_history?.length || 0} intercambios`);
                      // El historial se usará en el prompt de la IA
                    }
                  }).catch(err => logger.warn('[MEMORIA PERSISTENTE] Error cargando historial previo:', err));
                }
              }
            }).catch(err => logger.warn('[MEMORIA PERSISTENTE] Error creando call log:', err));
          }
          
          // 🚀 REAL-TIME PIPELINE: Generar saludo automático (después de ringtones)
          logger.info(`[WEBSOCKET] Cliente ${agentId} listo después de ringtones - disparando saludo automático`);
          
          // Generar saludo automático (sin condicionar modelo)
          generateNaturalGreeting(ws, voiceServices, agentId).catch((error) => {
            logger.error(`[WEBSOCKET] Error generando saludo automático para ${agentId}:`, error);
          });
        } else if (action === 'message' && payload?.type === 'resume_session') {
          // 🚀 GPT-4o: Reanudar sesión después de reconexión usando sessionId
          const sessionId = payload.sessionId;
          logger.info(`[PIPELINE ROBUSTO] 🔄 Reanudando sesión ${sessionId} para ${agentId}`);
          
          // 🚀 GPT-4o: Buscar sesión existente por sessionId (no solo por agentId)
          const existingSession = sessionMap.get(sessionId);
          const deepgramData = deepgramConnections.get(agentId);
          
          if (existingSession) {
            // Sesión existente encontrada - restaurar estado
            logger.info(`[PIPELINE ROBUSTO] ✅ Sesión ${sessionId} encontrada - restaurando estado completo`, {
              greetingSent: existingSession.greetingSent,
              lastFinalizedTranscript: existingSession.lastFinalizedTranscript?.substring(0, 50),
              lastAIResponse: existingSession.lastAIResponse?.substring(0, 50),
              createdAt: existingSession.createdAt
            });
            
            // 🚀 GPT-4o: Restaurar estado completo en deepgramData
            if (deepgramData) {
              deepgramData.greetingSent = existingSession.greetingSent;
              deepgramData.sessionId = sessionId;
              deepgramData.lastFinalizedTranscript = existingSession.lastFinalizedTranscript || '';
              deepgramData.lastAIResponse = existingSession.lastAIResponse || null;
              if (existingSession.lastAIResponse) {
                deepgramData.lastAIResponseTimestamp = Date.now(); // Aproximado
              }
            }
            
            // Actualizar agentId en la sesión (puede cambiar en reconexión)
            existingSession.agentId = agentId;
            existingSession.lastReconnectedAt = new Date().toISOString();
            
            // NO enviar saludo si ya se envió
            if (existingSession.greetingSent) {
              logger.info(`[PIPELINE ROBUSTO] ✅ Sesión ${sessionId} reanudada - saludo ya enviado, continuando conversación`);
              ws.send(JSON.stringify({
                route: 'conserje',
                action: 'message',
                payload: {
                  type: 'session_resumed',
                  sessionId: sessionId,
                  greetingSent: true,
                  message: 'Sesión reanudada - continuando conversación'
                }
              }));
              return; // No enviar saludo
            }
          } else {
            // Nueva sesión - crear entrada
            logger.info(`[PIPELINE ROBUSTO] 🆕 Sesión ${sessionId} nueva - creando entrada`);
            sessionMap.set(sessionId, {
              agentId: agentId,
              greetingSent: false,
              lastFinalizedTranscript: null, // 🚀 GPT-4o: Cambiado de lastTranscript
              lastAIResponse: null, // 🚀 GPT-4o: Añadido para contexto
              createdAt: new Date().toISOString(),
              lastUpdatedAt: null,
              lastReconnectedAt: null
            });
            
            if (deepgramData) {
              deepgramData.sessionId = sessionId;
            }
          }
          
          // Si llegamos aquí y greetingSent es false, enviar saludo
          if (!existingSession || !existingSession.greetingSent) {
            logger.info(`[PIPELINE ROBUSTO] 👋 Enviando saludo para sesión ${sessionId}`);
            generateNaturalGreeting(ws, voiceServices, agentId).catch((error) => {
              logger.error(`[PIPELINE ROBUSTO] ❌ Error generando saludo natural para ${agentId}:`, error);
            });
          }
          
          // Enviar confirmación de que el servidor está listo para recibir audio
          ws.send(JSON.stringify({
            route: 'conserje',
            action: 'message',
            payload: { 
              type: 'session_resumed', 
              sessionId: sessionId, 
              greetingSent: existingSession?.greetingSent || false,
              message: 'Servidor listo para recibir audio'
            }
          }));
        } else {
          ws.send(JSON.stringify({
            route: 'error',
            action: 'message',
            payload: { error: `Unknown conserje action: ${action}` }
          }));
        }
        break;

      default:
        ws.send(JSON.stringify({
          route: 'error',
          action: 'message',
          payload: { error: `Unknown route: ${route}` }
        }));
    }
  } catch (error) {
    logger.error('Error handling voice message:', error);
    ws.send(JSON.stringify({
      route: 'error',
      action: 'message',
      payload: {
        error: 'Voice processing error',
        message: error.message
      }
    }));
  }
}

/**
 * Handle audio STT (Speech-to-Text) using Deepgram Streaming API
 * Maintains persistent connection per client for real-time transcription
 */
async function handleAudioSTT(payload, ws, voiceServices, agentId) {
  const { audio, format, mimeType, encoding, sampleRate, channels, sessionId } = payload;
  
  // 🚀 GPT-4o: Si hay sessionId, actualizar sessionMap y deepgramData
  if (sessionId) {
    logger.debug(`[PIPELINE ROBUSTO] 📥 Audio recibido con sessionId: ${sessionId}`);
    
    // Buscar o crear sesión
    let session = sessionMap.get(sessionId);
    if (!session) {
      logger.info(`[PIPELINE ROBUSTO] 🆕 Creando nueva sesión en sessionMap: ${sessionId}`);
      session = {
        agentId: agentId,
        greetingSent: false,
        lastTranscript: null,
        createdAt: new Date().toISOString(),
        lastReconnectedAt: null
      };
      sessionMap.set(sessionId, session);
    } else {
      // Actualizar agentId si cambió (reconexión)
      if (session.agentId !== agentId) {
        logger.info(`[PIPELINE ROBUSTO] 🔄 Actualizando agentId en sesión ${sessionId}: ${session.agentId} → ${agentId}`);
        session.agentId = agentId;
      }
    }
  }

  // #region agent log
  debugLog('socket-server.js:584', 'Audio STT payload received', { encoding, sampleRate, channels, format, audioLength: audio?.length }, 'A');
  // #endregion

  if (!audio) {
    ws.send(JSON.stringify({
      route: 'error',
      action: 'message',
      payload: { error: 'Audio data is required' }
    }));
    return;
  }

  if (voiceServices?.deepgram?.isConfigured === false) {
    if (!sttUnavailableAgents.has(agentId)) {
      sttUnavailableAgents.add(agentId);
      ws.send(JSON.stringify({
        route: 'error',
        action: 'message',
        payload: {
          error: 'STT processing failed',
          code: 'DEEPGRAM_NOT_CONFIGURED',
          message: 'Deepgram SDK not initialized - check DEEPGRAM_API_KEY'
        }
      }));
    }
    return;
  }

  if (!voiceServices || !voiceServices.deepgram || !voiceServices.deepgram.createStreamingConnection) {
    logger.error('Voice services not available in handleAudioSTT', {
      hasVoiceServices: !!voiceServices,
      hasDeepgram: !!voiceServices?.deepgram,
      hasCreateStreamingConnection: !!voiceServices?.deepgram?.createStreamingConnection
    });
    ws.send(JSON.stringify({
      route: 'error',
      action: 'message',
      payload: {
        error: 'STT processing failed',
        message: 'Voice services not configured on server'
      }
    }));
    return;
  }

  try {
    // Decode base64 audio to Buffer
    let audioBuffer;
    try {
      const normalizedFormat = typeof format === 'string' ? format.toLowerCase() : '';
      const normalizedMimeType = typeof mimeType === 'string' ? mimeType.toLowerCase() : '';
      audioBuffer = Buffer.from(audio, 'base64');
      if (audioBuffer.length === 0) {
        logger.warn('[DEEPGRAM] Empty audio buffer, skipping');
        return;
      }

      const looksLikeContainer =
        normalizedFormat.includes('webm') ||
        normalizedFormat.includes('mp4') ||
        normalizedFormat.includes('ogg') ||
        normalizedMimeType.includes('webm') ||
        normalizedMimeType.includes('mp4') ||
        normalizedMimeType.includes('ogg');

      // Skip tiny container chunks (often incomplete headers). Raw PCM (linear16) can be small.
      if (looksLikeContainer && audioBuffer.length < 2000) {
        logger.debug(`[DEEPGRAM] Audio chunk too small: ${audioBuffer.length} bytes, skipping (need 2000+ for valid container)`);
        return;
      }
    } catch (error) {
      logger.error('[DEEPGRAM] Error decoding audio base64:', error);
      return;
    }

    // Get or create Deepgram streaming connection for this client
    let deepgramData = deepgramConnections.get(agentId);
    
    // Check if connection exists and is ready
    if (deepgramData && deepgramData.connection) {
      // Verify connection is still open (0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)
      const state = deepgramData.connection.getReadyState ? deepgramData.connection.getReadyState() : null;
      if (state === 2 || state === 3) {
        logger.warn(`[DEEPGRAM] Connection closed (state: ${state}), recreating...`);
        try {
          deepgramData.connection.finish();
        } catch (e) {
          // Ignore errors when finishing closed connection
        }
        // Reset processing flag before deleting to allow recovery
        if (deepgramData) {
          deepgramData.isProcessing = false;
        }
        deepgramConnections.delete(agentId);
        deepgramData = null;
      }
    }

    // Prevent creating new connections if we're in error state (avoid spam of failed connections)
    if (sttErrorAgents.has(agentId) && (!deepgramData || !deepgramData.connection)) {
      logger.debug(`[DEEPGRAM] Agent ${agentId} in error state, skipping connection creation (will retry after timeout)`);
      return; // Skip processing this chunk - wait for error state to clear
    }
    
    if (!deepgramData || !deepgramData.connection) {
      logger.info(`[PIPELINE ROBUSTO] 🔌 Creating new streaming connection for ${agentId}${sessionId ? ` (sessionId: ${sessionId})` : ''}`);
      
      // 🚀 GPT-4o: Si hay sessionId y existe sesión, restaurar greetingSent
      if (sessionId) {
        const session = sessionMap.get(sessionId);
        if (session && session.greetingSent) {
          logger.info(`[PIPELINE ROBUSTO] ✅ Restaurando greetingSent=true desde sessionMap para ${sessionId}`);
          if (deepgramData) {
            deepgramData.greetingSent = true;
          }
        }
      }

      // ✅ Configuración según JSON Deepgram Playground
      const resolvedEncoding = (typeof encoding === 'string' && encoding.trim()) ? encoding.trim() : 'linear16';
      const resolvedSampleRate = Number.isFinite(Number(sampleRate)) ? Number(sampleRate) : 48000; // ✅ 48000 Hz según JSON
      const resolvedChannels = Number.isFinite(Number(channels)) ? Number(channels) : 1;

      // #region agent log
      debugLog('socket-server.js:691', 'Resolved audio params for Deepgram', { resolvedEncoding, resolvedSampleRate, resolvedChannels, originalSampleRate: sampleRate, originalEncoding: encoding }, 'A');
      // #endregion
       
      deepgramData = {
        connection: null,
        isProcessing: false,
        pendingAudio: [],
        lastInterimSentAt: 0,
        lastInterimText: '',
        lastFinalizedTranscript: '', // Track last finalized transcript to prevent duplicates
        lastFinalizedTimestamp: 0, // Timestamp of last finalized transcript
        processingTranscript: null, // Currently processing transcript (to prevent race conditions)
        greetingSent: false, // 🎯 CALL CENTER FEEDBACK: Flag para evitar saludos duplicados
        // 🚀 BUFFER INTELIGENTE: Procesamiento temprano de respuestas
        pendingAIResponse: null, // Respuesta de IA generada anticipadamente (interim)
        pendingAIRequest: null, // AbortController para cancelar request anticipado
        lastInterimProcessedAt: 0, // Timestamp de última transcripción interim procesada
        // 🚀 PIPELINE ROBUSTO: Cola FIFO de respuestas
        responseQueue: [], // Cola de respuestas generadas (FIFO)
        maxQueueSize: 3, // Máximo 3 respuestas en cola
        // 🚀 PIPELINE ROBUSTO: Métricas de latencia
        latencyMetrics: {
          transcriptionStart: 0,
          transcriptionEnd: 0,
          aiStart: 0,
          aiEnd: 0,
          ttsStart: 0,
          ttsEnd: 0,
          audioSent: 0
        },
        // 🛡️ PROTECCIÓN CONTRA ECO: Evitar que IA se escuche a sí misma
        lastAIResponse: null, // Última respuesta de IA enviada (para evitar eco)
        lastAIResponseTimestamp: 0, // Timestamp de última respuesta de IA
        // 🚀 FULL DUPLEX: Detección de usuario hablando/parado
        userSpeakingTimeout: null, // Timeout para detectar cuando el usuario deja de hablar
        isUserSpeaking: false // Flag para rastrear si el usuario está hablando
      };
      deepgramConnections.set(agentId, deepgramData);

      // Create new Deepgram streaming connection
      const connection = voiceServices.deepgram.createStreamingConnection({
        language: 'es',
        encoding: resolvedEncoding,
        sampleRate: resolvedSampleRate,
        channels: resolvedChannels,
        idleTimeoutMs: 30000, // 🚀 PIPELINE ROBUSTO: 30s para evitar desconexiones prematuras

        // 🔄 KEEPALIVE: Mantener conexión estable enviando silencio periódicamente
        keepAlive: true,
        keepAliveInterval: 5000, // 🚀 PIPELINE ROBUSTO: Enviar keepalive cada 5 segundos (según especificación)
        onTranscriptionFinalized: async (transcript, message) => {
          // 🚀 ROBUST DEDUPLICATION: Prevent duplicate transcriptions from multiple events
          const now = Date.now();
          const transcriptNormalized = transcript?.trim() || '';

          // Check 1: Empty transcript
          if (!transcriptNormalized) {
            logger.debug('[DEEPGRAM] Empty transcript in finalized event, skipping');
            return;
          }

          // Check 2: Already processing another transcript
          // ✅ MEJORADO: Solo bloquear si es realmente la misma transcripción
          // Permitir transcripciones nuevas aunque haya una en proceso
          if (deepgramData && deepgramData.isProcessing) {
            const currentProcessing = deepgramData.processingTranscript || '';
            const isSameTranscript = currentProcessing.toLowerCase().trim() === transcriptNormalized.toLowerCase().trim();

            // Solo bloquear si es EXACTAMENTE la misma transcripción
            if (isSameTranscript) {
              logger.debug('[DEEPGRAM] Skipping exact duplicate transcription', {
                agentId: agentId,
                transcript: transcriptNormalized.substring(0, 50)
              });
            return;
          }
          
            // Si es diferente, permitirla (usuario habló de nuevo)
            logger.info('[DEEPGRAM] New transcript while processing - allowing (user spoke again)', {
              agentId: agentId,
              currentProcessing: currentProcessing.substring(0, 50),
              newTranscript: transcriptNormalized.substring(0, 50)
            });
            // Resetear flag para permitir nueva transcripción
            deepgramData.isProcessing = false;
            deepgramData.processingTranscript = null;
          }

          // Check 3: Same transcript as last finalized (within 3 seconds) - prevent duplicate events
          // Deepgram envía múltiples eventos (idle_timeout, Results, speech_final) para la misma transcripción
          if (deepgramData &&
            deepgramData.lastFinalizedTranscript === transcriptNormalized &&
            (now - deepgramData.lastFinalizedTimestamp) < 3000) {
            logger.debug('[DEEPGRAM] Duplicate finalized transcript detected (multiple events), skipping', {
              agentId: agentId,
              transcript: transcriptNormalized.substring(0, 50),
              timeSinceLast: now - deepgramData.lastFinalizedTimestamp,
              eventType: message?.type || 'unknown'
            });
            return;
          }

          // Check 3.5: Si ya está procesando EXACTAMENTE esta transcripción, saltarla
          if (deepgramData &&
            deepgramData.isProcessing &&
            deepgramData.processingTranscript === transcriptNormalized) {
            logger.debug('[DEEPGRAM] Already processing this exact transcript, skipping duplicate event', {
              agentId: agentId,
              transcript: transcriptNormalized.substring(0, 50),
              eventType: message?.type || 'unknown'
            });
            return;
          }

          // Check 4: Transcript is subset of currently processing (race condition protection)
          if (deepgramData &&
            deepgramData.processingTranscript &&
            transcriptNormalized.length < deepgramData.processingTranscript.length &&
            deepgramData.processingTranscript.includes(transcriptNormalized)) {
            logger.warn('[DEEPGRAM] New transcript is subset of processing transcript, skipping', {
              agentId: agentId,
              processing: deepgramData.processingTranscript.substring(0, 50),
              new: transcriptNormalized.substring(0, 50)
            });
            return;
          }

          // 🚀 FILTRO ROBUSTO: Ignorar transcripciones incompletas, muy cortas o solo saludos
          // Este filtro previene que la IA responda a fragmentos de audio que no son mensajes completos
          const transcriptLower = transcriptNormalized.toLowerCase().trim();
          const transcriptWords = transcriptNormalized.trim().split(/\s+/).filter(w => w.length > 0);
          
          // 1. Filtrar transcripciones muy cortas (menos de 15 caracteres o menos de 4 palabras)
          const isTooShort = transcriptNormalized.trim().length < 15 || transcriptWords.length < 4;
          
          // 2. Filtrar transcripciones incompletas (no terminan con puntuación final y son cortas)
          const endsWithPunctuation = /[.!?]$/.test(transcriptNormalized.trim());
          const isIncomplete = !endsWithPunctuation && transcriptWords.length < 6;
          
          // 3. Filtrar solo saludos (después del saludo inicial) - 🚀 PIPELINE FINAL: Filtro mejorado
          // Detecta saludos solos o seguidos de puntuación/comas, incluso con repeticiones
          const isOnlyGreeting = deepgramData?.greetingSent === true && 
            /^(hola|buenos días|buenas tardes|buenas noches|hey|hi|buenas)[\s,\.!]*(\s*(hola|buenas|buenos días|buenas tardes|buenas noches)[\s,\.!]*)*$/i.test(transcriptLower);
          
          // 4. Filtrar fragmentos que son claramente incompletos (palabras sueltas o frases muy cortas)
          const isFragment = transcriptWords.length <= 2 && transcriptNormalized.trim().length < 25;
          
          // 5. Filtrar si es substring de una transcripción anterior reciente (mismo usuario hablando)
          const isSubstringOfRecent = deepgramData?.lastFinalizedTranscript && 
            deepgramData.lastFinalizedTranscript.length > transcriptNormalized.length &&
            deepgramData.lastFinalizedTranscript.includes(transcriptNormalized) &&
            (now - deepgramData.lastFinalizedTimestamp) < 3000; // Dentro de 3 segundos
          
          // 6. Filtrar si es extensión de una transcripción anterior reciente (mismo inicio, más palabras)
          // Ejemplo: "Hola, buenas. Sí, mira, quiero" → "Hola, buenas. Sí, mira, quiero conseguir un aloja"
          let isExtensionOfRecent = false;
          if (deepgramData?.lastFinalizedTranscript && (now - deepgramData.lastFinalizedTimestamp) < 3000) {
            const lastLower = deepgramData.lastFinalizedTranscript.toLowerCase().trim();
            // Si la transcripción actual empieza con la anterior (es una extensión)
            if (transcriptLower.startsWith(lastLower) && transcriptLower.length > lastLower.length) {
              // Y la diferencia es pequeña (menos de 30 caracteres o 5 palabras), es probablemente una extensión
              const diff = transcriptLower.substring(lastLower.length).trim();
              const diffWords = diff.split(/\s+/).filter(w => w.length > 0);
              if (diff.length < 30 && diffWords.length < 5) {
                isExtensionOfRecent = true;
              }
            }
          }
          
          if (isTooShort || isIncomplete || isOnlyGreeting || isFragment || isSubstringOfRecent || isExtensionOfRecent) {
            logger.debug('[FILTRO] ⏭️ Ignorando transcripción (incompleta, muy corta, fragmento, substring o extensión)', {
              transcript: transcriptNormalized.substring(0, 60),
              isTooShort,
              isIncomplete,
              isOnlyGreeting,
              isFragment,
              isSubstringOfRecent,
              isExtensionOfRecent,
              wordCount: transcriptWords.length,
              length: transcriptNormalized.trim().length,
              lastTranscript: deepgramData?.lastFinalizedTranscript?.substring(0, 60)
            });
            return;
          }

          // 🛡️ PROTECCIÓN CONTRA ECO: No procesar si la transcripción coincide con la última respuesta de IA
          // Esto evita que la IA se escuche a sí misma y se responda
          if (deepgramData?.lastAIResponse && (now - deepgramData.lastAIResponseTimestamp) < 5000) {
            const lastResponseLower = deepgramData.lastAIResponse.toLowerCase().trim();
            const transcriptLower = transcriptNormalized.toLowerCase().trim();
            
            // Verificar si la transcripción es similar a la última respuesta (posible eco)
            const similarity = calculateSimilarity(transcriptLower, lastResponseLower);
            if (similarity > 0.7) {
              logger.debug('[PROTECCIÓN ECO] 🛡️ Ignorando transcripción (posible eco de respuesta de IA)', {
                transcript: transcriptNormalized.substring(0, 50),
                lastResponse: deepgramData.lastAIResponse.substring(0, 50),
                similarity: similarity.toFixed(2)
              });
              return;
            }
          }

          // ✅ VALID TRANSCRIPT - Process it
          logger.info(`[DEEPGRAM] ✅ Utterance finalized (${message?.type || 'unknown'}): "${transcriptNormalized}"`);

          // ⚠️ CRITICAL: Update tracking ANTES de procesar para evitar race conditions
          // Esto previene que múltiples eventos de Deepgram procesen la misma transcripción
          if (deepgramData) {
            deepgramData.lastFinalizedTranscript = transcriptNormalized;
            deepgramData.lastFinalizedTimestamp = now;
            deepgramData.processingTranscript = transcriptNormalized;
            deepgramData.isProcessing = true; // Marcar INMEDIATAMENTE
          }

          // Emit transcript to client (useful for debugging / UX feedback)
          try {
            if (ws.readyState === 1) {
              ws.send(JSON.stringify({
                route: 'conserje',
                action: 'message',
                payload: {
                  type: 'transcription_final',
                  text: transcript,
                  language: 'es'
                }
              }));
            }
          } catch (_) { }

          // ⚠️ NOTA: isProcessing ya se marcó arriba (línea 808) para evitar race conditions
          // No necesitamos marcarlo de nuevo aquí

          try {
            // 🚀 BUFFER INTELIGENTE: Verificar si ya tenemos respuesta anticipada
            let aiResponse = null;
            
            if (deepgramData?.pendingAIResponse) {
              // ✅ Latencia cero: usar respuesta del buffer inteligente
              aiResponse = deepgramData.pendingAIResponse;
              deepgramData.pendingAIResponse = null;
              
              // Limpiar request pendiente
              if (deepgramData.pendingAIRequest) {
                deepgramData.pendingAIRequest = null;
              }
              
              logger.info(`[BUFFER INTELIGENTE] ⚡ Usando respuesta anticipada: "${aiResponse.substring(0, 50)}..."`);
            } else {
              // Procesar normalmente si no hay respuesta anticipada
              logger.info(`🤖 Processing transcript with AI: "${transcript.substring(0, 50)}${transcript.length > 50 ? '...' : ''}"`);
              
              // Cancelar cualquier request pendiente
              if (deepgramData?.pendingAIRequest) {
                try {
                  deepgramData.pendingAIRequest.abort();
                } catch (e) { }
                deepgramData.pendingAIRequest = null;
              }
              
              // 🚀 NEON BUFFER: Obtener historial de conversación desde base de datos
              let conversationHistory = [];
              if (neonService && deepgramData?.sessionId) {
                try {
                  conversationHistory = await neonService.getConversationContext(deepgramData.sessionId, 5);
                  logger.debug(`[NEON BUFFER] 📚 Historial recuperado: ${conversationHistory.length} intercambios`);
                } catch (error) {
                  logger.warn('[NEON BUFFER] ⚠️ Error obteniendo historial (continuando):', error.message);
                }
              }

              // 🚀 GPT-4o: Pasar contexto completo de conversación a la IA
              const conversationContext = {
                greetingSent: deepgramData?.greetingSent === true,
                lastFinalizedTranscript: deepgramData?.lastFinalizedTranscript || null, // 🚀 GPT-4o: Contexto previo
                lastAIResponse: deepgramData?.lastAIResponse || null, // 🚀 GPT-4o: Última respuesta para coherencia
                conversationHistory: conversationHistory // 🚀 NEON BUFFER: Historial completo desde base de datos
              };
              
              logger.info(`[PIPELINE ROBUSTO] 📋 Contexto enviado a IA:`, {
                greetingSent: conversationContext.greetingSent,
                hasLastTranscript: !!conversationContext.lastFinalizedTranscript,
                hasLastResponse: !!conversationContext.lastAIResponse,
                historyLength: conversationHistory.length
              });
              
              aiResponse = await voiceServices.ai.processMessage(transcript, conversationContext);
            }

            if (!aiResponse || aiResponse.trim().length === 0) {
              logger.error('[AI] Empty response received from AI');
              ws.send(JSON.stringify({
                route: 'error',
                action: 'message',
                payload: {
                  error: 'AI did not generate a response',
                  message: 'The AI provider returned an empty response'
                }
              }));
              if (deepgramData) deepgramData.isProcessing = false;
              return;
            }

            logger.info(`💬 AI Response received (${aiResponse.length} chars): "${aiResponse.substring(0, 100)}${aiResponse.length > 100 ? '...' : ''}"`);

            // 🚀 NEON BUFFER: Guardar intercambio de conversación en base de datos
            if (neonService && deepgramData?.sessionId) {
              try {
                const metadata = {
                  greetingSent: deepgramData?.greetingSent || false,
                  latency: {
                    transcription: deepgramData?.latencyMetrics?.transcriptionEnd - deepgramData?.latencyMetrics?.transcriptionStart || 0,
                    ai: deepgramData?.latencyMetrics?.aiEnd - deepgramData?.latencyMetrics?.aiStart || 0
                  }
                };
                await neonService.saveConversationExchange(
                  deepgramData.sessionId,
                  agentId,
                  transcript,
                  aiResponse,
                  metadata
                );
                logger.debug(`[NEON BUFFER] ✅ Conversación guardada para sesión ${deepgramData.sessionId}`);
                
                // 🚀 MEMORIA PERSISTENTE: Actualizar call log en el stream durante la conversación
                const callContext = ws._callContext;
                if (callContext && callContext.callId && neonService) {
                  try {
                    // Detectar intención básica del transcript
                    let intent = null;
                    if (transcript.toLowerCase().includes('reserv') || transcript.toLowerCase().includes('reservar')) {
                      intent = 'reservar_alojamiento';
                    } else if (transcript.toLowerCase().includes('disponib') || transcript.toLowerCase().includes('disponible')) {
                      intent = 'consultar_disponibilidad';
                    } else if (transcript.toLowerCase().includes('precio') || transcript.toLowerCase().includes('coste')) {
                      intent = 'consultar_precio';
                    }
                    
                    await neonService.updateCallLogConversation(callContext.callId, {
                      userTranscript: transcript,
                      aiResponse: aiResponse,
                      intent: intent
                    });
                  } catch (error) {
                    logger.warn('[MEMORIA PERSISTENTE] Error actualizando call log:', error);
                  }
                }
              } catch (error) {
                // No bloquear la conversación si falla el guardado
                logger.warn('[NEON BUFFER] ⚠️ Error guardando conversación (continuando):', error.message);
              }
            }

            // 🚀 PIPELINE ROBUSTO: Registrar métricas de latencia
            if (deepgramData?.latencyMetrics) {
              deepgramData.latencyMetrics.transcriptionEnd = Date.now();
              deepgramData.latencyMetrics.aiEnd = Date.now();
              const transcriptionLatency = deepgramData.latencyMetrics.transcriptionEnd - deepgramData.latencyMetrics.transcriptionStart;
              const aiLatency = deepgramData.latencyMetrics.aiEnd - deepgramData.latencyMetrics.aiStart;
              logger.info(`[LATENCIA] 📊 Métricas: Transcripción=${transcriptionLatency}ms, IA=${aiLatency}ms`);
            }

            // ✅ SOLO REST API - Simple, estable, un solo modelo (aura-2-carina-es)
            try {
              // 🚀 PIPELINE ROBUSTO: Registrar inicio de TTS
              if (deepgramData?.latencyMetrics) {
                deepgramData.latencyMetrics.ttsStart = Date.now();
              }
              
              const responseAudio = await voiceServices.generateVoice(aiResponse, {
                model: 'aura-2-carina-es'
              });
              
              // 🚀 PIPELINE ROBUSTO: Registrar fin de TTS
              if (deepgramData?.latencyMetrics) {
                deepgramData.latencyMetrics.ttsEnd = Date.now();
              }

              if (responseAudio.type === 'tts' && responseAudio.data) {
                // 🛡️ PROTECCIÓN CONTRA ECO: Guardar última respuesta de IA
                if (deepgramData) {
                  deepgramData.lastAIResponse = aiResponse;
                  deepgramData.lastAIResponseTimestamp = Date.now();
                  
                  // 🚀 GPT-4o: Actualizar sessionMap con contexto de conversación
                  if (deepgramData.sessionId) {
                    const session = sessionMap.get(deepgramData.sessionId);
                    if (session) {
                      session.lastFinalizedTranscript = transcript;
                      session.lastAIResponse = aiResponse;
                      session.lastUpdatedAt = new Date().toISOString();
                      logger.info(`[PIPELINE ROBUSTO] ✅ SessionMap actualizado con contexto para ${deepgramData.sessionId}`);
                    }
                  }
                  
                  // 🚀 PIPELINE ROBUSTO: Registrar envío de audio y calcular latencia total
                  deepgramData.latencyMetrics.audioSent = Date.now();
                  const totalLatency = deepgramData.latencyMetrics.audioSent - deepgramData.latencyMetrics.transcriptionStart;
                  const ttsLatency = deepgramData.latencyMetrics.ttsEnd - deepgramData.latencyMetrics.ttsStart;
                  logger.info(`[LATENCIA] 📊 Latencia total: ${totalLatency}ms (TTS: ${ttsLatency}ms)`);
                }
                
            ws.send(JSON.stringify({
                  route: 'audio',
                  action: 'tts',
              payload: {
                    audio: responseAudio.data,
                    format: 'mp3',
                text: aiResponse,
                language: 'es'
              }
            }));
                if (deepgramData) deepgramData.isProcessing = false;
                return;
              }

              throw new Error('Invalid TTS response format');

            } catch (ttsError) {
              logger.error('[TTS] ❌ ERROR CRÍTICO: No se pudo generar audio:', ttsError);
              throw new Error(`TTS failed: ${ttsError.message}`);
            }

          } catch (error) {
            logger.error('[DEEPGRAM] Error processing transcript with AI:', {
              error: error.message,
              stack: error.stack?.substring(0, 300),
              transcript: transcript.substring(0, 50)
            });

            // Extract detailed error information
            let errorDetails = error.message || 'Unknown error occurred while processing with AI';
            let errorType = 'AI processing failed';

            // Check if it's the "All AI providers failed" error
            if (error.message && error.message.includes('All AI providers failed')) {
              errorType = 'All AI providers failed';
              // Try to extract provider errors from the message
              const errorsMatch = error.message.match(/Errors: (.+)/);
              if (errorsMatch) {
                errorDetails = `No hay proveedores de AI funcionando. Errores: ${errorsMatch[1]}`;
              } else {
                errorDetails = 'Todos los proveedores de AI fallaron. Verifica las API keys en Render Dashboard.';
              }
            }

            ws.send(JSON.stringify({
              route: 'error',
              action: 'message',
              payload: {
                error: errorType,
                message: errorDetails,
                details: {
                  transcript: transcript.substring(0, 50),
                  timestamp: new Date().toISOString()
                }
              }
            }));
          } finally {
            // Reset processing flag and clear processing transcript
            if (deepgramData) {
              deepgramData.isProcessing = false;
              deepgramData.processingTranscript = null;
            }
          }
        },
        onTranscriptionUpdated: (interim, message) => {
          // Send interim transcription for real-time feedback (optional)
          logger.debug(`[DEEPGRAM] Interim: "${interim}"`);

          try {
            if (!interim || !interim.trim()) return;
            if (ws.readyState !== 1) return;

            const now = Date.now();
            const lastText = deepgramData?.lastInterimText || '';
            const lastAt = deepgramData?.lastInterimSentAt || 0;

            // Throttle: avoid spamming the UI (max ~4 msgs/sec) and skip duplicates
            if (interim === lastText && (now - lastAt) < 1500) return;

            // 🚀 PIPELINE ROBUSTO: Detección anticipada de final de frase
            // Analizar transcripción interim para detectar si el usuario terminó de hablar
            const interimTrimmed = interim.trim();
            const hasPunctuation = /[.!?]$/.test(interimTrimmed);
            const hasComma = /,/.test(interimTrimmed);
            const wordCount = interimTrimmed.split(/\s+/).filter(w => w.length > 0).length;
            const charCount = interimTrimmed.length;
            
            // 🚀 GPT-4o: Detección anticipada mejorada - NO procesar frases incompletas que generan "Parece que tu mensaje está incompleto"
            // Criterios más estrictos: puntuación final Y (mínimo 4 palabras Y 30+ caracteres) O (6+ palabras Y 50+ caracteres)
            // Esto evita procesar fragmentos como "una habitación para" que generan respuestas confusas
            const seemsComplete = (hasPunctuation && wordCount >= 4 && charCount >= 30) || 
                                  (wordCount >= 6 && charCount >= 50);
            
            // 🚀 GPT-4o: Aumentar umbral de silencio antes de procesar (de 400ms a 800ms)
            // Esto da más tiempo para que el usuario complete la frase antes de procesar
            if (seemsComplete && !deepgramData?.pendingAIResponse && !deepgramData?.isProcessing) {
              const timeSinceLastProcess = now - (deepgramData?.lastInterimProcessedAt || 0);
              // Solo procesar si han pasado al menos 800ms desde la última vez (GPT-4o recomendación)
              if (timeSinceLastProcess >= 800) {
                logger.info(`[DETECCIÓN ANTICIPADA] 🎯 Frase parece completa: "${interimTrimmed.substring(0, 50)}..." - procesando anticipadamente`);
                deepgramData.lastInterimProcessedAt = now;
                deepgramData.latencyMetrics.transcriptionStart = now;
                
                // Cancelar request anterior si existe
                if (deepgramData.pendingAIRequest) {
                  try {
                    deepgramData.pendingAIRequest.abort();
                  } catch (_) {}
                }
                
                // Crear nuevo AbortController para este request
                const controller = new AbortController();
                deepgramData.pendingAIRequest = controller;
                
                // Procesar transcripción interim anticipadamente
                processInterimTranscript(interimTrimmed, ws, voiceServices, agentId, deepgramData, controller).catch(err => {
                  if (err.name !== 'AbortError') {
                    logger.debug('[DETECCIÓN ANTICIPADA] Error procesando interim:', err.message);
                  }
                });
              }
            }

            // 🚀 PIPELINE CALL CENTER: NO enviar ningún mensaje de user_speaking/user_stopped
            // NO hay barge-in, NO hay ajuste de volúmenes, NO hay cortes
            // El sistema es completamente fluido - ambos pueden hablar a la vez sin interferencia
            // El cliente ignora estos mensajes de todas formas, pero no los enviamos para evitar confusión
            // Solo procesar la transcripción normalmente, sin notificaciones especiales

            if ((now - lastAt) < 250) return;

            if (deepgramData) {
              deepgramData.lastInterimText = interim;
              deepgramData.lastInterimSentAt = now;
            }

            ws.send(JSON.stringify({
              route: 'conserje',
              action: 'message',
              payload: {
                type: 'transcription_interim',
                text: interim,
                language: 'es'
              }
            }));

            // 🚀 ELIMINADO: Procesamiento duplicado de transcripciones interim
            // Este código causaba respuestas duplicadas porque procesaba la misma transcripción
            // dos veces: una vez aquí y otra vez cuando llegaba la transcripción finalizada.
            // El buffer inteligente ya se maneja en la detección anticipada (línea 1280),
            // así que este procesamiento adicional es redundante y causa duplicados.
          } catch (_) { }
        },
        onError: (error) => {
          // Log detailed error information for debugging
          logger.error('[DEEPGRAM] Streaming connection error:', {
            error: error?.message || 'Unknown error',
            stack: error?.stack,
            agentId: agentId,
            errorObject: error
          });

          // Reset processing flag before removing connection to allow recovery
          const errorDeepgramData = deepgramConnections.get(agentId);
          if (errorDeepgramData) {
            errorDeepgramData.isProcessing = false;
          }

          // Send error to client only once, but allow recovery by NOT blocking future connections
          if (!sttErrorAgents.has(agentId)) {
            sttErrorAgents.add(agentId);

            // Log detailed error information for debugging
            const errorDetails = {
              message: error?.message || 'Unknown error',
              code: error?.code,
              name: error?.name,
              stack: error?.stack?.substring(0, 200), // First 200 chars of stack
              type: typeof error,
              stringified: String(error)
            };
            logger.error(`[DEEPGRAM] STT streaming error for ${agentId}:`, errorDetails);

            ws.send(JSON.stringify({
              route: 'error',
              action: 'message',
              payload: {
                error: 'STT streaming error',
                code: 'DEEPGRAM_STREAM_ERROR',
                message: error?.message || errorDetails.stringified || 'Unknown Deepgram streaming error',
                details: errorDetails.message // Include more details for debugging
              }
            }));
            logger.warn(`[DEEPGRAM] STT error reported for ${agentId}, but recovery allowed`);
          }

          // Delete connection to allow recreation on next audio chunk
          deepgramConnections.delete(agentId);
          // IMPORTANT: Allow recovery by removing from error agents after a delay
          // Use longer delay (5 seconds) to prevent spam of failed connection attempts
          setTimeout(() => {
            sttErrorAgents.delete(agentId);
            logger.info(`[DEEPGRAM] Error agent ${agentId} cleared after timeout, ready for recovery`);
          }, 5000); // Clear after 5 seconds to allow new connection (prevents spam)
        },
        onClose: () => {
          logger.info(`[DEEPGRAM] Streaming connection closed for ${agentId}`);

          // Reset processing flag before removing connection to allow recovery
          const closedDeepgramData = deepgramConnections.get(agentId);
          if (closedDeepgramData) {
            closedDeepgramData.isProcessing = false;
          }

          deepgramConnections.delete(agentId);
        }
      });

      deepgramData.connection = connection;

      // Buffer audio until Deepgram socket is OPEN (prevents dropping the first WebM header chunk)
      connection.on('open', () => {
        try {
          const pendingCount = deepgramData?.pendingAudio?.length || 0;
          if (!pendingCount) return;
          logger.info(`[DEEPGRAM] Connection open. Flushing ${pendingCount} buffered chunks for ${agentId}`);
          const buffersToFlush = deepgramData.pendingAudio.splice(0, pendingCount);
          for (const buf of buffersToFlush) {
            deepgramData.connection.send(buf);
          }
        } catch (flushError) {
          logger.error('[DEEPGRAM] Error flushing buffered audio:', flushError);
        }
      });
      
      logger.info(`[DEEPGRAM] ✅ Streaming connection established for ${agentId}`, {
        agentId: agentId,
        encoding: resolvedEncoding,
        sampleRate: resolvedSampleRate,
        channels: resolvedChannels
      });
    }

    // Send audio buffer to Deepgram streaming connection
    if (deepgramData && deepgramData.connection) {
      try {
        // Check connection state before sending
        const readyState = deepgramData.connection.getReadyState ? deepgramData.connection.getReadyState() : null;
        if (readyState === 0) {
          // CONNECTING: buffer to avoid losing WebM headers on the first chunks
          deepgramData.pendingAudio.push(audioBuffer);
          if (deepgramData.pendingAudio.length > 10) deepgramData.pendingAudio.shift();
          return;
        }

        if (readyState !== null && readyState !== 1) {
          logger.warn(`[DEEPGRAM] Connection not ready (state: ${readyState}), skipping chunk`);
          return;
        }

        // Flush any buffered chunks first (if the socket is now open)
        if (deepgramData.pendingAudio && deepgramData.pendingAudio.length) {
          const buffersToFlush = deepgramData.pendingAudio.splice(0, deepgramData.pendingAudio.length);
          for (const buf of buffersToFlush) {
            deepgramData.connection.send(buf);
          }
        }
        
        // Send audio buffer to Deepgram
        deepgramData.connection.send(audioBuffer);
        logger.debug(`[DEEPGRAM] ✅ Sent audio chunk: ${audioBuffer.length} bytes to ${agentId}`, {
          agentId: agentId,
          chunkSize: audioBuffer.length,
          connectionState: deepgramData.connection.getReadyState ? deepgramData.connection.getReadyState() : 'unknown'
        });
      } catch (error) {
        logger.error('[DEEPGRAM] ❌ Error sending audio to Deepgram:', error);
        logger.error('[DEEPGRAM] Error details:', {
          message: error.message,
          stack: error.stack?.substring(0, 300),
          bufferSize: audioBuffer.length
        });
        
        // Try to recreate connection on error
        if (deepgramData && deepgramData.connection) {
          try {
            deepgramData.connection.finish();
          } catch (finishError) {
            // Ignore errors when finishing broken connection
          }
          // Reset processing flag to allow recovery
          deepgramData.isProcessing = false;
        }
        deepgramConnections.delete(agentId);
        
        // Send error to client
        ws.send(JSON.stringify({
          route: 'error',
          action: 'message',
          payload: {
            error: 'STT connection error',
            message: 'Error sending audio to transcription service. Please try again.'
          }
        }));
      }
    } else {
      logger.warn(`[DEEPGRAM] No connection available for ${agentId}, skipping chunk`);
    }

  } catch (error) {
    logger.error('Error in audio STT processing:', error);
    ws.send(JSON.stringify({
      route: 'error',
      action: 'message',
      payload: {
        error: 'STT processing failed',
        message: error.message
      }
    }));
  }
}

/**
 * Handle audio TTS request (Text-to-Speech)
 */
async function handleAudioTTS(payload, ws, voiceServices) {
  const { text } = payload;

  if (!text) {
    ws.send(JSON.stringify({
      route: 'error',
      action: 'message',
      payload: { error: 'Text is required for TTS' }
    }));
    return;
  }

  try {
    logger.info(`🔊 Loading native voice audio for: "${text.substring(0, 50)}..."`);
    // Send text to client for native voice playback (client handles audio locally)
    // Note: We no longer generate audio on server - client uses native voice file
    // ✅ SOLO REST API - Simple, estable, un solo modelo (aura-2-carina-es)
    const audioResult = await voiceServices.generateVoice(text, { model: 'aura-2-carina-es' });

    // Extract audio data based on type
    let audioData;
    let audioFormat = 'mp3';

    if (audioResult.type === 'tts' && audioResult.data) {
      audioData = audioResult.data;
      audioFormat = 'mp3';
    } else if (audioResult.type === 'native' && audioResult.data) {
      audioData = audioResult.data.toString('base64');
      audioFormat = 'wav';
    } else {
      logger.error('[TTS] ❌ Unexpected audio result type:', audioResult.type);
      throw new Error(`Unexpected audio type: ${audioResult.type}`);
    }

    ws.send(JSON.stringify({
      route: 'audio',
      action: 'tts',
      payload: {
        audio: audioData,
        format: audioFormat,
        text,
        isWelcome: payload.isWelcome || false,
        isNative: audioResult.type === 'native'
      }
    }));
  } catch (error) {
    logger.error('Error in TTS generation:', error);
    ws.send(JSON.stringify({
      route: 'error',
      action: 'message',
      payload: {
        error: 'TTS generation failed',
        message: error.message
      }
    }));
  }
}

/**
 * 🛡️ PROTECCIÓN CONTRA ECO: Calcular similitud entre dos textos
 * Retorna un valor entre 0 (completamente diferente) y 1 (idéntico)
 */
function calculateSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  if (text1 === text2) return 1;
  
  // Normalizar: remover puntuación y espacios extra
  const normalize = (str) => str.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const n1 = normalize(text1);
  const n2 = normalize(text2);
  
  if (n1 === n2) return 1;
  if (n1.length === 0 || n2.length === 0) return 0;
  
  // Calcular similitud simple: palabras comunes
  const words1 = new Set(n1.split(/\s+/));
  const words2 = new Set(n2.split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * 🚀 BUFFER INTELIGENTE: Procesar transcripción interim para generar respuesta anticipada
 * Esta función genera la respuesta de IA ANTES de que el usuario termine de hablar,
 * reduciendo la latencia percibida a casi cero
 */
async function processInterimTranscript(interimText, ws, voiceServices, agentId, deepgramData, abortController) {
  try {
    if (!voiceServices || !voiceServices.ai) {
      return;
    }

    logger.debug(`[BUFFER INTELIGENTE] 🧠 Procesando transcripción interim: "${interimText.substring(0, 50)}..."`);

    // 🚀 PIPELINE FINAL: Pasar contexto completo de conversación
    const conversationContext = {
      greetingSent: deepgramData?.greetingSent === true,
      lastFinalizedTranscript: deepgramData?.lastFinalizedTranscript || null,
      lastAIResponse: deepgramData?.lastAIResponse || null
    };

    // Generar respuesta de IA (sin bloquear, puede ser cancelada)
    const aiResponse = await voiceServices.ai.processMessage(interimText, conversationContext);

    // Verificar si fue cancelada
    if (abortController?.signal?.aborted) {
      logger.debug('[BUFFER INTELIGENTE] ⏹️ Respuesta cancelada (usuario continuó hablando)');
      return;
    }

    // Verificar si ya se procesó una transcripción finalizada
    if (deepgramData?.isProcessing) {
      logger.debug('[BUFFER INTELIGENTE] ⏹️ Respuesta ignorada (ya se procesó transcripción finalizada)');
      return;
    }

    // Guardar respuesta en buffer
    if (deepgramData) {
      deepgramData.pendingAIResponse = aiResponse;
      deepgramData.pendingAIRequest = null;
      logger.info(`[BUFFER INTELIGENTE] ✅ Respuesta anticipada generada: "${aiResponse.substring(0, 50)}..."`);
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      logger.debug('[BUFFER INTELIGENTE] ⏹️ Procesamiento cancelado');
    } else {
      logger.debug('[BUFFER INTELIGENTE] ❌ Error:', error.message);
    }
    if (deepgramData) {
      deepgramData.pendingAIRequest = null;
    }
  }
}

/**
 * Generate natural greeting using AI (not fixed text)
 * After ringtones, AI generates a natural greeting that matches the conversational tone
 */
async function generateNaturalGreeting(ws, voiceServices, agentId) {
  try {
    if (!voiceServices || !voiceServices.generateVoice) {
      logger.error('Voice services not available for greeting');
      return;
    }

    // 🚀 SALUDO AUTOMÁTICO: Sin condicionar al modelo - simplemente disparar voz automáticamente
    // Saludo predefinido simple y directo - NO usar IA para evitar condicionamiento y repeticiones
    const greetingText = 'Hola, soy Sandra. ¿En qué puedo ayudarte?';
    
    logger.info(`[GREETING] 🔊 Disparando saludo automático: "${greetingText}"`);

    // ⏱️ LATENCIA MÍNIMA: Generar TTS directamente sin pasar por IA (máximo 1 segundo)
    const greetingAudio = await voiceServices.generateVoice(greetingText, {
      model: 'aura-2-carina-es'
    });

    if (greetingAudio.type === 'tts' && greetingAudio.data) {
      logger.info('[GREETING] ✅ Audio del saludo generado con TTS');
      ws.send(JSON.stringify({
        route: 'audio',
        action: 'tts',
        payload: {
          audio: greetingAudio.data,
          format: 'mp3',
          text: greetingText,
          isWelcome: true
        }
      }));

      // 🎯 Marcar que ya se envió el saludo inicial
      const deepgramData = deepgramConnections.get(agentId);
      if (deepgramData) {
        deepgramData.greetingSent = true;
        logger.info(`[PIPELINE ROBUSTO] ✅ Flag greetingSent activado para ${agentId}`);
        
        // Actualizar sessionMap si existe sessionId
        if (deepgramData.sessionId) {
          const session = sessionMap.get(deepgramData.sessionId);
          if (session) {
            session.greetingSent = true;
            logger.info(`[PIPELINE ROBUSTO] ✅ SessionMap actualizado para ${deepgramData.sessionId}`);
          }
        }
      }
      
      logger.info('✅ Saludo automático enviado (sin condicionar modelo)');
    } else {
      logger.error('[GREETING] ❌ Invalid TTS response format');
    }
  } catch (error) {
    logger.error('[GREETING] ❌ Error generando saludo automático:', error);
    // No enviar error al cliente - simplemente continuar sin saludo
  }
}

