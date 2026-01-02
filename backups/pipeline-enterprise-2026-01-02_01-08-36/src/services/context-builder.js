/**
 * Context Builder Service
 * Builds shared context from project data for agent synchronization
 */

import logger from '../utils/logger.js';

class ContextBuilder {
  constructor(neonService) {
    this.neonService = neonService;
  }

  /**
   * Build complete project context
   */
  async buildProjectContext(projectId) {
    try {
      const project = await this.neonService.getProject(projectId);
      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      const context = {
        project: {
          id: project.id,
          name: project.name,
          path: project.path,
          status: project.status,
          description: project.description,
          created_at: project.created_at
        },
        lockStatus: await this.buildLockStatus(projectId),
        proposals: await this.buildProposalsContext(projectId),
        plans: await this.buildPlansContext(projectId),
        activeImplementation: await this.buildActiveImplementation(projectId),
        sharedMemory: await this.buildSharedMemory(projectId),
        recentChanges: await this.buildRecentChanges(projectId, 10)
      };

      return context;
    } catch (error) {
      logger.error('Failed to build project context:', error);
      throw error;
    }
  }

  /**
   * Build lock status information
   */
  async buildLockStatus(projectId) {
    try {
      const lockInfo = await this.neonService.checkProjectLock(projectId);
      if (!lockInfo) {
        return {
          status: 'unlocked',
          locked_by: null,
          locked_at: null,
          expires_at: null
        };
      }

      return {
        status: lockInfo.lock_status,
        locked_by: lockInfo.locked_by,
        locked_at: lockInfo.locked_at,
        expires_at: lockInfo.lock_expires_at
      };
    } catch (error) {
      logger.error('Failed to build lock status:', error);
      return { status: 'unknown' };
    }
  }

  /**
   * Build proposals context
   */
  async buildProposalsContext(projectId) {
    try {
      const proposals = await this.neonService.getProjectProposals(projectId);

      const context = {
        total: proposals.length,
        byStatus: {},
        recent: [],
        details: []
      };

      // Group by status
      for (const proposal of proposals) {
        if (!context.byStatus[proposal.status]) {
          context.byStatus[proposal.status] = 0;
        }
        context.byStatus[proposal.status]++;
      }

      // Get recent proposals (last 5)
      context.recent = proposals.slice(0, 5).map(p => ({
        id: p.id,
        title: p.title,
        agent: p.agent_id,
        status: p.status,
        created_at: p.created_at
      }));

      // Get detailed proposals for context
      for (const proposal of proposals.slice(0, 10)) {
        const reviews = await this.neonService.getProposalReviews(proposal.id);
        context.details.push({
          id: proposal.id,
          title: proposal.title,
          agent: p.agent_id,
          status: proposal.status,
          review_count: reviews.length,
          file_count: this.countFiles(proposal.files)
        });
      }

      return context;
    } catch (error) {
      logger.error('Failed to build proposals context:', error);
      return { total: 0, byStatus: {}, recent: [], details: [] };
    }
  }

  /**
   * Build plans context
   */
  async buildPlansContext(projectId) {
    try {
      const plans = await this.neonService.getProjectPlans(projectId);

      const context = {
        total: plans.length,
        byStatus: {},
        recent: [],
        ready_for_approval: [],
        ready_for_implementation: []
      };

      // Group by status
      for (const plan of plans) {
        if (!context.byStatus[plan.status]) {
          context.byStatus[plan.status] = 0;
        }
        context.byStatus[plan.status]++;
      }

      // Get recent plans (last 5)
      context.recent = plans.slice(0, 5).map(p => ({
        id: p.id,
        title: p.title,
        status: p.status,
        created_at: p.created_at
      }));

      // Get plans ready for approval (draft status)
      context.ready_for_approval = plans
        .filter(p => p.status === 'draft' || p.status === 'pending_approval')
        .map(p => ({
          id: p.id,
          title: p.title,
          proposal_count: (p.proposal_ids || []).length
        }));

      // Get plans ready for implementation (approved status)
      context.ready_for_implementation = plans
        .filter(p => p.status === 'approved')
        .map(p => ({
          id: p.id,
          title: p.title,
          assigned_to: p.assigned_implementer_id
        }));

      return context;
    } catch (error) {
      logger.error('Failed to build plans context:', error);
      return { total: 0, byStatus: {}, recent: [], ready_for_approval: [], ready_for_implementation: [] };
    }
  }

  /**
   * Build active implementation context
   */
  async buildActiveImplementation(projectId) {
    try {
      const implementation = await this.neonService.getActiveImplementation(projectId);
      if (!implementation) {
        return null;
      }

      return {
        id: implementation.id,
        plan_id: implementation.plan_id,
        agent: implementation.agent_id,
        status: implementation.status,
        started_at: implementation.start_time,
        files_changed: this.countFiles(implementation.files_changed)
      };
    } catch (error) {
      logger.error('Failed to build active implementation context:', error);
      return null;
    }
  }

  /**
   * Build shared memory context
   */
  async buildSharedMemory(projectId) {
    try {
      const memory = await this.neonService.getAllSharedMemory(projectId);
      if (!memory || memory.length === 0) {
        return {};
      }

      const context = {};
      for (const entry of memory) {
        context[entry.key] = entry.value;
      }

      return context;
    } catch (error) {
      logger.error('Failed to build shared memory context:', error);
      return {};
    }
  }

  /**
   * Build recent changes context
   */
  async buildRecentChanges(projectId, limit = 10) {
    try {
      const logs = await this.neonService.getProjectChangeLogs(projectId, limit);

      return logs.map(log => ({
        id: log.id,
        entity_type: log.entity_type,
        action: log.action,
        agent: log.agent_id,
        timestamp: log.created_at
      }));
    } catch (error) {
      logger.error('Failed to build recent changes context:', error);
      return [];
    }
  }

  /**
   * Build read-only context for agents (what they can see)
   */
  async buildReadOnlyContext(projectId, agentId) {
    try {
      const fullContext = await this.buildProjectContext(projectId);

      // Filter sensitive data based on agent permissions
      const readOnlyContext = {
        project: fullContext.project,
        lockStatus: fullContext.lockStatus,
        proposals: fullContext.proposals,
        plans: fullContext.plans,
        activeImplementation: fullContext.activeImplementation,
        sharedMemory: fullContext.sharedMemory
      };

      return readOnlyContext;
    } catch (error) {
      logger.error('Failed to build read-only context:', error);
      return {};
    }
  }

  /**
   * Build synchronization summary for WebSocket
   */
  async buildSyncSummary(projectId) {
    try {
      const context = await this.buildProjectContext(projectId);

      return {
        timestamp: new Date().toISOString(),
        project_id: projectId,
        lock_status: context.lockStatus.status,
        proposal_count: context.proposals.total,
        plan_count: context.plans.total,
        active_implementation: context.activeImplementation ? true : false,
        pending_approvals: context.plans.ready_for_approval.length
      };
    } catch (error) {
      logger.error('Failed to build sync summary:', error);
      return null;
    }
  }

  /**
   * Build detailed proposal context
   */
  async buildProposalContext(proposalId) {
    try {
      const proposal = await this.neonService.getProposal(proposalId);
      if (!proposal) {
        throw new Error(`Proposal ${proposalId} not found`);
      }

      const reviews = await this.neonService.getProposalReviews(proposalId);

      return {
        id: proposal.id,
        title: proposal.title,
        description: proposal.description,
        agent: proposal.agent_id,
        status: proposal.status,
        created_at: proposal.created_at,
        files: this.parseFiles(proposal.files),
        reasoning: proposal.reasoning,
        reviews: {
          count: reviews.length,
          details: reviews.map(r => ({
            reviewer: r.reviewer_agent_id,
            score: r.score,
            status: r.status,
            created_at: r.created_at
          }))
        }
      };
    } catch (error) {
      logger.error('Failed to build proposal context:', error);
      throw error;
    }
  }

  /**
   * Build detailed plan context
   */
  async buildPlanContext(planId) {
    try {
      const plan = await this.neonService.getPlan(planId);
      if (!plan) {
        throw new Error(`Plan ${planId} not found`);
      }

      const proposals = [];
      for (const proposalId of (plan.proposal_ids || [])) {
        const proposal = await this.neonService.getProposal(proposalId);
        if (proposal) {
          proposals.push({
            id: proposal.id,
            title: proposal.title,
            agent: proposal.agent_id
          });
        }
      }

      return {
        id: plan.id,
        title: plan.title,
        description: plan.description,
        status: plan.status,
        created_at: plan.created_at,
        approved_at: plan.approved_at,
        approved_by: plan.approval_agent_id,
        assigned_to: plan.assigned_implementer_id,
        source_proposals: proposals,
        merged_content: plan.merged_content ? this.parseJSON(plan.merged_content) : null
      };
    } catch (error) {
      logger.error('Failed to build plan context:', error);
      throw error;
    }
  }

  /**
   * Helper: Parse JSON safely
   */
  parseJSON(data) {
    try {
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch {
      return data;
    }
  }

  /**
   * Helper: Parse files array
   */
  parseFiles(filesData) {
    const files = this.parseJSON(filesData);
    return Array.isArray(files) ? files : [];
  }

  /**
   * Helper: Count files
   */
  countFiles(filesData) {
    const files = this.parseFiles(filesData);
    return files.length;
  }
}

export default ContextBuilder;
