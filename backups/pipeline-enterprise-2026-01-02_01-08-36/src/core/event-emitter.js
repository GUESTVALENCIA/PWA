/**
 * Event Emitter para sistema de eventos
 */

import { EventEmitter } from 'events';

export class SystemEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  // Project events
  emitProjectCreated(projectId) {
    this.emit('project:created', { projectId, timestamp: new Date().toISOString() });
  }

  emitProjectLocked(projectId, agentId) {
    this.emit('project:locked', { projectId, agentId, timestamp: new Date().toISOString() });
  }

  emitProjectUnlocked(projectId) {
    this.emit('project:unlocked', { projectId, timestamp: new Date().toISOString() });
  }

  // Proposal events
  emitProposalCreated(proposalId, projectId, agentId) {
    this.emit('proposal:created', { proposalId, projectId, agentId, timestamp: new Date().toISOString() });
  }

  emitProposalReviewed(proposalId, reviewerAgent) {
    this.emit('proposal:reviewed', { proposalId, reviewerAgent, timestamp: new Date().toISOString() });
  }

  // Plan events
  emitPlanCreated(planId, proposalIds) {
    this.emit('plan:created', { planId, proposalIds, timestamp: new Date().toISOString() });
  }

  emitPlanApproved(planId) {
    this.emit('plan:approved', { planId, timestamp: new Date().toISOString() });
  }

  // Implementation events
  emitImplementationStarted(planId, agentId) {
    this.emit('implementation:started', { planId, agentId, timestamp: new Date().toISOString() });
  }

  emitImplementationCompleted(planId, agentId) {
    this.emit('implementation:completed', { planId, agentId, timestamp: new Date().toISOString() });
  }
}
