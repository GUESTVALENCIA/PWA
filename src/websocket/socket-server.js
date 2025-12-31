/**
 * WebSocket Server for Real-Time Synchronization
 * Handles agent connections and broadcasts state changes
 */

import logger from '../utils/logger.js';

// Active agent subscriptions: Map<agentId, Set<projectIds>>
const agentSubscriptions = new Map();
// Agent WebSocket connections: Map<agentId, ws>
const agentConnections = new Map();

/**
 * Initialize WebSocket server
 */
export function initWebSocketServer(wss, stateManager, systemEventEmitter, neonService, voiceServices = null) {
  wss.on('connection', (ws, req) => {
    const agentId = req.headers['x-agent-id'] || `agent_${Math.random().toString(36).substring(7)}`;
    const connectionTime = new Date().toISOString();

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
      message: 'Connected to MCP Orchestrator'
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

  if (!voiceServices) {
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
  if (!voiceServices.deepgram || !voiceServices.cartesia || !voiceServices.ai) {
    logger.warn('Voice services not fully initialized', {
      hasDeepgram: !!voiceServices.deepgram,
      hasCartesia: !!voiceServices.cartesia,
      hasAI: !!voiceServices.ai
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

  try {
    switch (route) {
      case 'audio':
        if (action === 'stt') {
          await handleAudioSTT(payload, ws, voiceServices);
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
          await handleWelcomeMessage(ws, voiceServices);
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
 * Handle audio STT (Speech-to-Text) - Process user audio and generate response
 */
async function handleAudioSTT(payload, ws, voiceServices) {
  const { audio, format, mimeType } = payload;

  if (!audio) {
    ws.send(JSON.stringify({
      route: 'error',
      action: 'message',
      payload: { error: 'Audio data is required' }
    }));
    return;
  }

  if (!voiceServices || !voiceServices.deepgram || !voiceServices.deepgram.transcribeAudio) {
    logger.error('Voice services not available in handleAudioSTT', {
      hasVoiceServices: !!voiceServices,
      hasDeepgram: !!voiceServices?.deepgram,
      hasTranscribeAudio: !!voiceServices?.deepgram?.transcribeAudio
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
    // 1. Transcribe audio
    logger.info('🎤 Processing audio STT...', { 
      audioLength: audio?.length || 0, 
      format: format || 'webm',
      mimeType: mimeType || 'audio/webm'
    });
    
    // Determinar formato del audio
    const audioFormat = format || (mimeType?.includes('webm') ? 'webm' : 'webm');
    const transcript = await voiceServices.deepgram.transcribeAudio(audio, audioFormat);

    if (!transcript || transcript.trim().length === 0) {
      // No speech detected
      ws.send(JSON.stringify({
        route: 'conserje',
        action: 'message',
        payload: {
          type: 'noSpeech',
          message: 'No se detectó habla en el audio'
        }
      }));
      return;
    }

    logger.info(`📝 Transcript: "${transcript}"`);

    // 2. Process with AI (Gemini/GPT-4/Groq)
    logger.info('🤖 Processing with AI...');
    const aiResponse = await voiceServices.ai.processMessage(transcript);

    if (!aiResponse || aiResponse.trim().length === 0) {
      ws.send(JSON.stringify({
        route: 'error',
        action: 'message',
        payload: { error: 'AI did not generate a response' }
      }));
      return;
    }

    logger.info(`💬 AI Response: "${aiResponse.substring(0, 100)}..."`);

    // 3. Generate TTS audio
    logger.info('🔊 Generating TTS...');
    const responseAudio = await voiceServices.cartesia.generateVoice(aiResponse);

    // 4. Send audio response
    ws.send(JSON.stringify({
      route: 'audio',
      action: 'tts',
      payload: {
        audio: responseAudio,
        format: 'mp3',
        text: aiResponse,
        isWelcome: false
      }
    }));

    logger.info('✅ Audio response sent to client');
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
    logger.info(`🔊 Generating TTS for: "${text.substring(0, 50)}..."`);
    const audio = await voiceServices.cartesia.generateVoice(text);

    ws.send(JSON.stringify({
      route: 'audio',
      action: 'tts',
      payload: {
        audio,
        format: 'mp3',
        text,
        isWelcome: payload.isWelcome || false
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
 * Handle welcome message - Send pre-recorded welcome audio
 */
async function handleWelcomeMessage(ws, voiceServices) {
  try {
    logger.info('👋 Sending welcome message...');
    const welcomeAudio = await voiceServices.getWelcomeAudio();

    ws.send(JSON.stringify({
      route: 'audio',
      action: 'tts',
      payload: {
        audio: welcomeAudio,
        format: 'mp3',
        text: '¡Hola! Soy Sandra, tu asistente virtual de Guests Valencia. ¿En qué puedo ayudarte?',
        isWelcome: true
      }
    }));

    logger.info('✅ Welcome message sent');
  } catch (error) {
    logger.error('Error sending welcome message:', error);
    ws.send(JSON.stringify({
      route: 'error',
      action: 'message',
      payload: {
        error: 'Welcome message failed',
        message: error.message
      }
    }));
  }
}
