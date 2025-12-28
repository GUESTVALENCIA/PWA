/**
 * Servidor WebSocket para sincronización real-time
 */

import { logger } from '../utils/logger.js';

export function initWebSocketServer(wss, stateManager) {
  wss.on('connection', (ws, req) => {
    const agentId = req.headers['x-agent-id'] || `agent_${Math.random().toString(36).substring(7)}`;

    logger.info(`✅ WebSocket conectado: ${agentId}`);

    // Registrar agente
    if (stateManager) {
      stateManager.registerAgent(agentId, ws);
    }

    // Manejadores de mensajes
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        handleMessage(data, agentId, stateManager);
      } catch (error) {
        logger.error('Error procesando WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      logger.info(`🔴 WebSocket desconectado: ${agentId}`);
      if (stateManager) {
        stateManager.unregisterAgent(agentId);
      }
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Conectado a MCP Orchestrator',
      agentId
    }));
  });
}

function handleMessage(data, agentId, stateManager) {
  const { type, payload } = data;

  switch (type) {
    case 'subscribe_project':
      // Agente se suscribe a updates de proyecto
      logger.info(`📢 ${agentId} subscribed to project ${payload.projectId}`);
      break;

    case 'ping':
      // Heartbeat
      logger.debug(`💓 Ping from ${agentId}`);
      break;

    default:
      logger.warn(`Unknown message type: ${type}`);
  }
}
