/**
 * State Manager - Gestión del estado global del sistema
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';

export class StateManager extends EventEmitter {
  constructor() {
    super();
    this.projects = new Map();
    this.proposals = new Map();
    this.plans = new Map();
    this.implementations = new Map();
    this.locks = new Map(); // Proyectos bloqueados
    this.activeAgents = new Map(); // Agentes conectados
  }

  // ===== PROYECTOS =====
  registerProject(project) {
    this.projects.set(project.id, {
      ...project,
      status: 'active',
      lock_status: 'unlocked',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    this.emit('project:registered', project.id);
    logger.info(`✅ Proyecto registrado: ${project.name}`);
  }

  getProject(projectId) {
    return this.projects.get(projectId);
  }

  updateProject(projectId, updates) {
    const project = this.projects.get(projectId);
    if (!project) return null;

    const updated = { ...project, ...updates, updated_at: new Date().toISOString() };
    this.projects.set(projectId, updated);
    this.emit('project:updated', projectId);
    return updated;
  }

  // ===== PROPUESTAS =====
  registerProposal(proposal) {
    this.proposals.set(proposal.id, {
      ...proposal,
      status: 'pending',
      created_at: new Date().toISOString(),
      reviews: []
    });
    this.emit('proposal:created', proposal.id);
  }

  getProposal(proposalId) {
    return this.proposals.get(proposalId);
  }

  updateProposal(proposalId, updates) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) return null;

    const updated = { ...proposal, ...updates };
    this.proposals.set(proposalId, updated);
    this.emit('proposal:updated', proposalId);
    return updated;
  }

  addReview(proposalId, review) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) return null;

    proposal.reviews.push({
      ...review,
      created_at: new Date().toISOString()
    });

    this.proposals.set(proposalId, proposal);
    this.emit('review:added', { proposalId, review });
    return proposal;
  }

  // ===== PLANES UNIFICADOS =====
  registerPlan(plan) {
    this.plans.set(plan.id, {
      ...plan,
      status: 'pending',
      created_at: new Date().toISOString()
    });
    this.emit('plan:created', plan.id);
  }

  getPlan(planId) {
    return this.plans.get(planId);
  }

  updatePlan(planId, updates) {
    const plan = this.plans.get(planId);
    if (!plan) return null;

    const updated = { ...plan, ...updates };
    this.plans.set(planId, updated);
    this.emit('plan:updated', planId);
    return updated;
  }

  // ===== BLOQUEOS DE PROYECTO =====
  lockProject(projectId, agentId) {
    this.locks.set(projectId, {
      agent: agentId,
      locked_at: new Date().toISOString(),
      timeout: Date.now() + (30 * 60 * 1000) // 30 minutos
    });
    this.emit('project:locked', { projectId, agentId });
    logger.info(`🔒 Proyecto bloqueado para ${agentId}: ${projectId}`);
  }

  unlockProject(projectId) {
    this.locks.delete(projectId);
    this.emit('project:unlocked', projectId);
    logger.info(`🔓 Proyecto desbloqueado: ${projectId}`);
  }

  isProjectLocked(projectId) {
    const lock = this.locks.get(projectId);
    if (!lock) return false;

    // Check timeout
    if (Date.now() > lock.timeout) {
      this.unlockProject(projectId);
      return false;
    }

    return true;
  }

  getProjectLock(projectId) {
    return this.locks.get(projectId);
  }

  // ===== AGENTES ACTIVOS =====
  registerAgent(agentId, socket) {
    this.activeAgents.set(agentId, {
      id: agentId,
      connected_at: new Date().toISOString(),
      socket: socket
    });
    this.emit('agent:connected', agentId);
    logger.info(`🟢 Agente conectado: ${agentId}`);
  }

  unregisterAgent(agentId) {
    this.activeAgents.delete(agentId);
    this.emit('agent:disconnected', agentId);
    logger.info(`🔴 Agente desconectado: ${agentId}`);
  }

  isAgentActive(agentId) {
    return this.activeAgents.has(agentId);
  }

  getActiveAgents() {
    return Array.from(this.activeAgents.keys());
  }

  // ===== BROADCAST =====
  broadcastToAgents(message, excludeAgent = null) {
    this.activeAgents.forEach((agent, agentId) => {
      if (excludeAgent && agentId === excludeAgent) return;

      try {
        if (agent.socket && agent.socket.readyState === 1) { // OPEN
          agent.socket.send(JSON.stringify(message));
        }
      } catch (e) {
        logger.error(`Error enviando a ${agentId}:`, e);
      }
    });
  }

  // ===== ESTADÍSTICAS =====
  getStats() {
    return {
      projects: this.projects.size,
      proposals: this.proposals.size,
      plans: this.plans.size,
      locked_projects: this.locks.size,
      active_agents: this.activeAgents.size
    };
  }
}
