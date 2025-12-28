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
export function initWebSocketServer(wss, stateManager, systemEventEmitter, neonService) {
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
        handleMessage(data, agentId, ws, wss, neonService, systemEventEmitter);
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
function handleMessage(data, agentId, ws, wss, neonService, systemEventEmitter) {
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
