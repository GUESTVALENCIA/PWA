/**
 * WebSocket Server for Real-Time Synchronization
 * Handles agent connections and broadcasts state changes
 */

import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEBUG_LOG_PATH = path.join(__dirname, '../../.cursor/debug.log');
const debugLog = (location, message, data, hypothesisId) => {
  try {
    const logEntry = {location, message, data, timestamp:Date.now(), sessionId:'debug-session', runId:'run1', hypothesisId};
    if (!fs.existsSync(path.dirname(DEBUG_LOG_PATH))) fs.mkdirSync(path.dirname(DEBUG_LOG_PATH), {recursive:true});
    fs.appendFileSync(DEBUG_LOG_PATH, JSON.stringify(logEntry) + '\n');
  } catch(e) {}
};

// Active agent subscriptions: Map<agentId, Set<projectIds>>
const agentSubscriptions = new Map();
// Agent WebSocket connections: Map<agentId, ws>
const agentConnections = new Map();
// Deepgram streaming connections: Map<agentId, { connection, isProcessing }>
const deepgramConnections = new Map();
// Track agents where STT is not available (prevents error spam)
const sttUnavailableAgents = new Set();
// Track agents where STT errors already reported (prevents error spam)
const sttErrorAgents = new Set();

/**
 * Initialize WebSocket server
 */
export function initWebSocketServer(wss, stateManager, systemEventEmitter, neonService, voiceServices = null) {
  // #region agent log
  debugLog('socket-server.js:18', 'initWebSocketServer called', {voiceServicesIsNull:voiceServices===null,hasVoiceServices:!!voiceServices,hasDeepgram:!!voiceServices?.deepgram,hasAI:!!voiceServices?.ai,hasWelcomeAudio:!!voiceServices?.getWelcomeAudio}, 'E');
  // #endregion
	  wss.on('connection', (ws, req) => {
	    const agentId = req.headers['x-agent-id'] || `agent_${Math.random().toString(36).substring(7)}`;
	    const connectionTime = new Date().toISOString();
		    const sttAvailable = voiceServices?.deepgram?.isConfigured === true;

    logger.info(`✅ WebSocket connected: ${agentId}`);

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

    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        handleMessage(data, agentId, ws, wss, neonService, systemEventEmitter, voiceServices);
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
      
      // Close Deepgram streaming connection if exists
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
function handleMessage(data, agentId, ws, wss, neonService, systemEventEmitter, voiceServices) {
  // Soporte para formato route/action (sistema de voz)
  if (data.route && data.action) {
    handleVoiceMessage(data, agentId, ws, voiceServices).catch(error => {
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
async function handleVoiceMessage(data, agentId, ws, voiceServices) {
  const { route, action, payload } = data;

  // #region agent log
  debugLog('socket-server.js:430', 'handleVoiceMessage called', {route,action,voiceServicesIsNull:voiceServices===null,hasVoiceServices:!!voiceServices,hasDeepgram:!!voiceServices?.deepgram,hasAI:!!voiceServices?.ai,hasWelcomeAudio:!!voiceServices?.getWelcomeAudio,voiceServicesKeys:voiceServices?Object.keys(voiceServices):[]}, 'D');
  // #endregion

  if (!voiceServices) {
    // #region agent log
    debugLog('socket-server.js:433', 'Voice services is NULL - sending error', {route,action}, 'A');
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
    debugLog('socket-server.js:469', 'Voice services missing required properties', {hasDeepgram:!!voiceServices.deepgram,hasAI:!!voiceServices.ai,hasWelcomeAudio:!!voiceServices.getWelcomeAudio,hasGenerateVoice:!!voiceServices.generateVoice,allKeys:voiceServices?Object.keys(voiceServices):[],voiceServicesType:typeof voiceServices}, 'C');
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
  debugLog('socket-server.js:490', 'Voice services validation PASSED', {hasDeepgram:!!voiceServices.deepgram,hasAI:!!voiceServices.ai,hasWelcomeAudio:!!voiceServices.getWelcomeAudio,hasGenerateVoice:!!voiceServices.generateVoice}, 'D');
  // #endregion

  try {
    switch (route) {
      case 'audio':
        if (action === 'stt') {
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
          // 🚀 ENTERPRISE: Saludo inicial generado en tiempo real (Deepgram TTS)
          await handleInitialGreeting(ws, voiceServices);
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
  const { audio, format, mimeType, encoding, sampleRate, channels } = payload;

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
        deepgramConnections.delete(agentId);
        deepgramData = null;
      }
    }
    
    if (!deepgramData || !deepgramData.connection) {
      logger.info(`[DEEPGRAM] 🔌 Creating new streaming connection for ${agentId}`);

      // Clear error status when creating new connection (allows recovery)
      sttErrorAgents.delete(agentId);

      const resolvedEncoding = (typeof encoding === 'string' && encoding.trim()) ? encoding.trim() : null;
      const resolvedSampleRate = Number.isFinite(Number(sampleRate)) ? Number(sampleRate) : null;
      const resolvedChannels = Number.isFinite(Number(channels)) ? Number(channels) : null;
       
      deepgramData = {
        connection: null,
        isProcessing: false,
        pendingAudio: [],
        lastInterimSentAt: 0,
        lastInterimText: ''
      };
      deepgramConnections.set(agentId, deepgramData);

      // Create new Deepgram streaming connection
      const connection = voiceServices.deepgram.createStreamingConnection({
        language: 'es',
        encoding: resolvedEncoding,
        sampleRate: resolvedSampleRate,
        channels: resolvedChannels,
        idleTimeoutMs: 600, // 🚀 ENTERPRISE MAX: Reducido a 600ms para latencia mínima (balance óptimo)
        onTranscriptionFinalized: async (transcript, message) => {
          // Handle finalized transcription (VAD detected end of phrase)
          if (deepgramData && deepgramData.isProcessing) {
            logger.warn('[DEEPGRAM] Already processing, skipping duplicate transcription');
            return;
          }
          
          if (!transcript || transcript.trim().length === 0) {
            logger.warn('[DEEPGRAM] Empty transcript in finalized event');
            return;
          }

          logger.info(`[DEEPGRAM] 📝 Finalized transcript: "${transcript}"`);

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
          } catch (_) {}
          
          // Mark as processing to prevent duplicate processing
          if (deepgramData) {
            deepgramData.isProcessing = true;
          }

          try {
            // Process with AI
            logger.info(`🤖 Processing transcript with AI: "${transcript.substring(0, 50)}${transcript.length > 50 ? '...' : ''}"`);
            const aiResponse = await voiceServices.ai.processMessage(transcript);

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

            // Generar audio de respuesta usando Deepgram TTS
            try {
              const responseAudio = await voiceServices.generateVoice(aiResponse, { streaming: false, model: 'aura-2-elvira-es' });
              
              // Handle different response types
              if (responseAudio.type === 'tts' && responseAudio.data) {
                // REST API fallback (MP3)
                logger.info('[TTS] ✅ Using Deepgram REST API (MP3)');
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
                logger.info('✅ Audio TTS response sent to client (REST API)');
                if (deepgramData) deepgramData.isProcessing = false;
                return;
              }
              
              // STREAMING CODE (DISABLED TEMPORARILY)
              if (false && responseAudio.type === 'streaming' && responseAudio.ws) {
                // TTS WebSocket streaming - send PCM chunks as they arrive
                logger.info('[TTS] 🎙️ Using TTS WebSocket streaming (PCM)');
                
                const ttsWs = responseAudio.ws;
                let firstChunk = true;
                
                // Send text to TTS
                voiceServices.sendTextToTTS(ttsWs, aiResponse);
                
                // Flush to start audio generation
                voiceServices.flushTTS(ttsWs);
                
                // Handle incoming PCM audio chunks
                ttsWs.on('message', (data) => {
                  if (data instanceof Buffer) {
                    // PCM audio data - send to client as base64
                    const pcmBase64 = data.toString('base64');
                    ws.send(JSON.stringify({
                      route: 'audio',
                      action: 'tts_chunk',
                      payload: {
                        audio: pcmBase64,
                        format: 'pcm',
                        sampleRate: 24000,
                        isFirst: firstChunk
                      }
                    }));
                    firstChunk = false;
                  } else {
                    // JSON message (status, etc.)
                    try {
                      const message = JSON.parse(data.toString());
                      if (message.type === 'Flushed') {
                        logger.info('[TTS] ✅ TTS buffer flushed');
                      } else if (message.type === 'Error') {
                        logger.error('[TTS] ❌ TTS error:', message);
                      }
                    } catch (e) {
                      // Not JSON, ignore
                    }
                  }
                });
                
                // Send completion when WebSocket closes
                ttsWs.on('close', () => {
                  ws.send(JSON.stringify({
                    route: 'audio',
                    action: 'tts_complete',
                    payload: {}
                  }));
                  logger.info('[TTS] ✅ TTS WebSocket streaming completed');
                });
                
                ttsWs.on('error', (error) => {
                  logger.error('[TTS] ❌ TTS WebSocket error:', error);
                  // Fallback to REST API
                  handleTTSFallback(aiResponse, ws);
                });
                
              } else if (responseAudio.type === 'native') {
                // Native audio file - send as base64
                logger.info('[TTS] ✅ Using native audio file');
                const audioBase64 = responseAudio.data.toString('base64');
                ws.send(JSON.stringify({
                  route: 'audio',
                  action: 'tts',
                  payload: {
                    audio: audioBase64,
                    format: 'wav',
                    text: aiResponse,
                    language: 'es',
                    isNative: true
                  }
                }));
              } else if (responseAudio.type === 'tts') {
                // REST API fallback (MP3)
                logger.info('[TTS] ✅ Using Deepgram REST API (MP3 fallback)');
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
              }
              
              logger.info('✅ Audio TTS response sent to client');
            } catch (ttsError) {
              logger.error('[TTS] ❌ ERROR CRÍTICO: No se pudo generar audio:', ttsError);
              throw new Error(`TTS failed: ${ttsError.message}`);
            }
            
            // Helper function for REST API fallback
            async function handleTTSFallback(text, clientWs) {
              try {
                const fallbackAudio = await voiceServices.generateVoice(text, { streaming: false, model: 'aura-2-elvira-es' });
                if (fallbackAudio.type === 'tts') {
                  clientWs.send(JSON.stringify({
                    route: 'audio',
                    action: 'tts',
                    payload: {
                      audio: fallbackAudio.data,
                      format: 'mp3',
                      text: text,
                      language: 'es'
                    }
                  }));
                }
              } catch (error) {
                logger.error('[TTS] ❌ Fallback also failed:', error);
              }
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
            // Reset processing flag
            if (deepgramData) {
              deepgramData.isProcessing = false;
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
          } catch (_) {}
        },
        onError: (error) => {
          logger.error('[DEEPGRAM] Streaming connection error:', error);

          // Reset processing flag before removing connection to allow recovery
          const errorDeepgramData = deepgramConnections.get(agentId);
          if (errorDeepgramData) {
            errorDeepgramData.isProcessing = false;
          }

          if (!sttErrorAgents.has(agentId)) {
            sttErrorAgents.add(agentId);
            ws.send(JSON.stringify({
              route: 'error',
              action: 'message',
              payload: {
                error: 'STT streaming error',
                code: 'DEEPGRAM_STREAM_ERROR',
                message: error?.message || 'Unknown Deepgram streaming error'
              }
            }));
          }

          deepgramConnections.delete(agentId);
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
      
      logger.info(`[DEEPGRAM] ✅ Streaming connection established for ${agentId}`);
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
        logger.debug(`[DEEPGRAM] ✅ Sent audio chunk: ${audioBuffer.length} bytes to ${agentId}`);
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
    // ⚠️ CRITICAL: Always use REST API and extract data property
    const audioResult = await voiceServices.generateVoice(text, { streaming: false, model: 'aura-2-elvira-es' });
    
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
 * Handle initial greeting - Generate greeting in real-time using Deepgram TTS
 * 🚀 ENTERPRISE: Saludo generado en tiempo real (no pregrabado) para experiencia natural
 */
// Helper function for REST API fallback
async function handleGreetingFallback(text, clientWs, voiceServices) {
  try {
    const fallbackAudio = await voiceServices.generateVoice(text, { streaming: false, model: 'aura-2-elvira-es' });
    if (fallbackAudio.type === 'tts') {
      clientWs.send(JSON.stringify({
        route: 'audio',
        action: 'tts',
        payload: {
          audio: fallbackAudio.data,
          format: 'mp3',
          text: text,
          isWelcome: true
        }
      }));
      logger.info('✅ Initial greeting sent (REST API fallback)');
    } else {
      logger.error('[TTS] ❌ Fallback returned unexpected type:', fallbackAudio.type);
      throw new Error('Fallback returned unexpected audio type');
    }
  } catch (error) {
    logger.error('[TTS] ❌ Greeting fallback also failed:', error);
    throw error;
  }
}

async function handleInitialGreeting(ws, voiceServices) {
  try {
    logger.info('👋 Generating initial greeting in real-time (Deepgram TTS)...');
    
    if (!voiceServices || !voiceServices.generateVoice) {
      logger.error('generateVoice not available in voiceServices');
      throw new Error('Voice generation service not available');
    }
    
    // 🚀 ENTERPRISE: Saludo corto, claro y conciso
    const greetingText = 'Hola, buenas, soy Sandra, tu asistente de Guests Valencia, ¿en qué puedo ayudarte hoy?';
    
    logger.info(`🎙️ Generating greeting audio: "${greetingText}"`);
    
    // Usar Deepgram TTS para el saludo (temporalmente para probar voces)
    try {
      const greetingAudio = await voiceServices.generateVoice(greetingText, { useNative: false, model: 'aura-2-elvira-es' });
      
      // ⚠️ CRITICAL: Never send WebSocket objects to client - handle streaming server-side
      if (greetingAudio.type === 'streaming' && greetingAudio.ws) {
        // TTS WebSocket streaming - send PCM chunks as they arrive
        logger.info('[TTS] 🎙️ Using TTS WebSocket streaming for greeting (PCM)');
        
        const ttsWs = greetingAudio.ws;
        let firstChunk = true;
        
        // Send text to TTS
        voiceServices.sendTextToTTS(ttsWs, greetingText);
        
        // Flush to start audio generation
        voiceServices.flushTTS(ttsWs);
        
        // Handle incoming PCM audio chunks
        ttsWs.on('message', (data) => {
          if (data instanceof Buffer) {
            // PCM audio data - send to client as base64
            const pcmBase64 = data.toString('base64');
            ws.send(JSON.stringify({
              route: 'audio',
              action: 'tts_chunk',
              payload: {
                audio: pcmBase64,
                format: 'pcm',
                sampleRate: 24000,
                isFirst: firstChunk,
                isWelcome: true
              }
            }));
            firstChunk = false;
            logger.debug(`[TTS] 📤 Sent PCM chunk to client (${pcmBase64.length} chars base64)`);
          } else {
            // JSON message (status, etc.)
            try {
              const message = JSON.parse(data.toString());
              if (message.type === 'Flushed') {
                logger.info('[TTS] ✅ Greeting TTS buffer flushed');
              } else if (message.type === 'Error') {
                logger.error('[TTS] ❌ Greeting TTS error:', message);
              }
            } catch (e) {
              // Not JSON, ignore
            }
          }
        });
        
        // Send completion when WebSocket closes
        ttsWs.on('close', () => {
          ws.send(JSON.stringify({
            route: 'audio',
            action: 'tts_complete',
            payload: {}
          }));
          logger.info('[TTS] ✅ Greeting TTS WebSocket streaming completed');
        });
        
        ttsWs.on('error', (error) => {
          logger.error('[TTS] ❌ Greeting TTS WebSocket error, falling back to REST:', error);
          // Fallback to REST API
          handleGreetingFallback(greetingText, ws, voiceServices).catch(err => {
            logger.error('[TTS] ❌ Fallback failed:', err);
          });
        });
        
        // ⚠️ CRITICAL: Return immediately - do NOT send greetingAudio object to client
        return; // Exit early if streaming is set up
      }
      
      // OPCIÓN 1: Usar VOZ NATIVA (archivo WAV)
      if (greetingAudio.type === 'native' && greetingAudio.data) {
        logger.info('[TTS] ✅ Using NATIVE voice file for greeting (your daughter\'s real voice)');
        const audioBase64 = greetingAudio.data.toString('base64');
        ws.send(JSON.stringify({
          route: 'audio',
          action: 'tts',
          payload: {
            audio: audioBase64,
            format: 'wav',
            text: greetingText,
            isWelcome: true,
            isNative: true
          }
        }));
        logger.info('✅ Initial greeting sent (NATIVE VOICE)');
        return;
      }
      
      // Fallback to REST API if native not available
      if (greetingAudio.type === 'tts' && greetingAudio.data) {
        logger.info('[TTS] ✅ Using Deepgram REST API for greeting (MP3 fallback)');
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
        logger.info('✅ Initial greeting sent (REST API)');
        return;
      }
      
      // ⚠️ If we get here, something unexpected happened
      logger.error('[TTS] ❌ Unexpected greetingAudio type:', greetingAudio.type);
      throw new Error(`Unexpected audio type: ${greetingAudio.type}`);
      
    } catch (streamingError) {
      logger.warn('[TTS] Streaming failed, falling back to REST:', streamingError);
      // Fall through to REST fallback
    }
    
    // Fallback to REST API
    await handleGreetingFallback(greetingText, ws, voiceServices);
    
  } catch (error) {
    logger.error('Error generating initial greeting:', error);
    ws.send(JSON.stringify({
      route: 'error',
      action: 'message',
      payload: {
        error: 'Initial greeting failed',
        message: error.message
      }
    }));
  }
}
