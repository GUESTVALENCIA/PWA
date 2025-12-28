/**
 * Unification Service
 * Merges multiple proposals into a single unified plan
 */

import logger from '../utils/logger.js';

class UnificationService {
  constructor(neonService, proposalService, reviewService, systemEventEmitter) {
    this.neonService = neonService;
    this.proposalService = proposalService;
    this.reviewService = reviewService;
    this.eventEmitter = systemEventEmitter;
  }

  /**
   * Unify multiple proposals into a single plan
   */
  async unifyProposals(projectId, proposalIds, unificationData) {
    try {
      const { title, description, strategy, createdBy } = unificationData;

      if (!proposalIds || proposalIds.length === 0) {
        throw new Error('At least one proposal ID is required');
      }

      if (!title) {
        throw new Error('Plan title is required');
      }

      // Validate all proposals exist and belong to same project
      const proposals = [];
      for (const proposalId of proposalIds) {
        const proposal = await this.neonService.getProposal(proposalId);
        if (!proposal) {
          throw new Error(`Proposal ${proposalId} not found`);
        }
        if (proposal.project_id !== projectId) {
          throw new Error(`Proposal ${proposalId} does not belong to project ${projectId}`);
        }
        proposals.push(proposal);
      }

      // Merge files from all proposals
      const mergedFiles = this.mergeProposalFiles(proposals);

      // Create unified plan in database
      const plan = await this.neonService.createUnifiedPlan(
        projectId,
        proposalIds,
        {
          title,
          description,
          strategy,
          createdBy
        }
      );

      // Store merged content
      await this.neonService.sql(
        `UPDATE unified_plans SET merged_content = $1 WHERE id = $2`,
        [JSON.stringify({
          merged_files: mergedFiles,
          source_proposals: proposalIds,
          merge_timestamp: new Date().toISOString()
        }), plan.id]
      );

      // Mark all proposals as unified
      await this.neonService.markProposalsAsUnified(proposalIds);

      // Emit event for real-time sync
      this.eventEmitter.emitPlanCreated(projectId, plan);

      logger.info(`✅ Plan unified: ${plan.id} from ${proposalIds.length} proposals`);

      return {
        plan,
        merged_files: mergedFiles
      };
    } catch (error) {
      logger.error('Failed to unify proposals:', error);
      throw error;
    }
  }

  /**
   * Intelligently merge proposal files
   */
  mergeProposalFiles(proposals) {
    try {
      const fileMap = new Map();
      const conflicts = [];

      // Collect all files from all proposals
      for (const proposal of proposals) {
        const files = this.parseFiles(proposal.files);

        for (const file of files) {
          const key = file.path || file.name;

          if (!fileMap.has(key)) {
            fileMap.set(key, {
              path: key,
              modifications: [],
              conflict: false
            });
          }

          fileMap.get(key).modifications.push({
            proposalId: proposal.id,
            agentId: proposal.agent_id,
            content: file.content,
            changes: file.changes || []
          });
        }
      }

      // Detect conflicts and create merge strategy
      const mergedFiles = [];
      for (const [path, fileData] of fileMap.entries()) {
        if (fileData.modifications.length > 1) {
          // File modified by multiple proposals
          const conflict = {
            path,
            type: 'multiple_modifications',
            proposalCount: fileData.modifications.length,
            proposals: fileData.modifications.map(m => ({
              id: m.proposalId,
              agent: m.agentId
            })),
            resolutionStrategy: 'manual_review_required'
          };

          conflicts.push(conflict);
          fileData.conflict = true;
        }

        mergedFiles.push({
          path,
          sourceCount: fileData.modifications.length,
          hasConflict: fileData.conflict,
          sources: fileData.modifications.map(m => ({
            proposalId: m.proposalId,
            agentId: m.agentId
          })),
          suggestedAction: fileData.conflict ? 'review' : 'merge'
        });
      }

      return {
        files: mergedFiles,
        conflicts: conflicts,
        conflictCount: conflicts.length,
        requiresManualReview: conflicts.length > 0,
        totalFiles: mergedFiles.length,
        mergeTime: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to merge proposal files:', error);
      throw error;
    }
  }

  /**
   * Parse files from proposal (handle string or object format)
   */
  parseFiles(filesData) {
    try {
      if (typeof filesData === 'string') {
        return JSON.parse(filesData);
      }
      return Array.isArray(filesData) ? filesData : [];
    } catch (error) {
      logger.warn('Failed to parse files:', error);
      return [];
    }
  }

  /**
   * Get plan with full details
   */
  async getPlanWithDetails(planId) {
    try {
      const plan = await this.neonService.getPlan(planId);
      if (!plan) {
        throw new Error(`Plan ${planId} not found`);
      }

      // Get source proposals
      const proposals = [];
      if (plan.proposal_ids && Array.isArray(plan.proposal_ids)) {
        for (const proposalId of plan.proposal_ids) {
          const proposal = await this.neonService.getProposal(proposalId);
          if (proposal) {
            proposals.push(proposal);
          }
        }
      }

      // Parse merged content
      const mergedContent = plan.merged_content
        ? (typeof plan.merged_content === 'string'
          ? JSON.parse(plan.merged_content)
          : plan.merged_content)
        : null;

      return {
        plan,
        proposals,
        mergedContent
      };
    } catch (error) {
      logger.error('Failed to get plan with details:', error);
      throw error;
    }
  }

  /**
   * Approve a unified plan
   */
  async approvePlan(planId, approvalAgentId) {
    try {
      const plan = await this.neonService.approvePlan(planId, approvalAgentId);
      if (!plan) {
        throw new Error(`Plan ${planId} not found`);
      }

      // Emit approval event
      this.eventEmitter.emitPlanApproved(plan.project_id, planId, approvalAgentId);

      logger.info(`✅ Plan ${planId} approved by ${approvalAgentId}`);
      return plan;
    } catch (error) {
      logger.error('Failed to approve plan:', error);
      throw error;
    }
  }

  /**
   * Reject a unified plan
   */
  async rejectPlan(planId, rejectionReason) {
    try {
      const plan = await this.neonService.updatePlanStatus(planId, 'rejected');
      if (!plan) {
        throw new Error(`Plan ${planId} not found`);
      }

      // Log rejection
      logger.info(`❌ Plan ${planId} rejected. Reason: ${rejectionReason}`);

      return plan;
    } catch (error) {
      logger.error('Failed to reject plan:', error);
      throw error;
    }
  }

  /**
   * Get plans ready for approval (status = draft or pending_approval)
   */
  async getPendingApprovalPlans(projectId) {
    try {
      const draftPlans = await this.neonService.getProjectPlans(projectId, 'draft');
      const pendingPlans = await this.neonService.getProjectPlans(projectId, 'pending_approval');

      return [...(draftPlans || []), ...(pendingPlans || [])];
    } catch (error) {
      logger.error('Failed to get pending approval plans:', error);
      return [];
    }
  }

  /**
   * Get approved plans ready for implementation
   */
  async getApprovedPlans(projectId) {
    try {
      return await this.neonService.getProjectPlans(projectId, 'approved');
    } catch (error) {
      logger.error('Failed to get approved plans:', error);
      return [];
    }
  }

  /**
   * Generate unification report
   */
  async generateUnificationReport(planId) {
    try {
      const planDetails = await this.getPlanWithDetails(planId);
      const { plan, proposals, mergedContent } = planDetails;

      const report = {
        plan: {
          id: plan.id,
          title: plan.title,
          status: plan.status,
          created_at: plan.created_at,
          approved_at: plan.approved_at,
          approved_by: plan.approval_agent_id
        },
        source_proposals: proposals.map(p => ({
          id: p.id,
          title: p.title,
          agent: p.agent_id,
          status: p.status
        })),
        merge_summary: mergedContent ? {
          total_files: mergedContent.total_files || 0,
          conflict_count: mergedContent.conflictCount || 0,
          requires_manual_review: mergedContent.requiresManualReview || false,
          merge_time: mergedContent.mergeTime
        } : null,
        conflicts: mergedContent?.conflicts || [],
        ready_for_implementation: plan.status === 'approved'
      };

      return report;
    } catch (error) {
      logger.error('Failed to generate unification report:', error);
      throw error;
    }
  }

  /**
   * Assign implementer to a plan
   */
  async assignImplementer(planId, implementerAgentId) {
    try {
      const plan = await this.neonService.assignImplementer(planId, implementerAgentId);
      if (!plan) {
        throw new Error(`Plan ${planId} not found`);
      }

      logger.info(`Plan ${planId} assigned to implementer ${implementerAgentId}`);
      return plan;
    } catch (error) {
      logger.error('Failed to assign implementer:', error);
      throw error;
    }
  }

  /**
   * Check if plan is ready for implementation
   */
  async isReadyForImplementation(planId) {
    try {
      const plan = await this.neonService.getPlan(planId);
      if (!plan) return false;

      return (
        plan.status === 'approved' &&
        plan.assigned_implementer_id !== null
      );
    } catch (error) {
      logger.error('Failed to check implementation readiness:', error);
      return false;
    }
  }

  /**
   * Analyze dependencies between proposals
   */
  analyzeDependencies(proposals) {
    try {
      const dependencies = {
        file_dependencies: [],
        logical_dependencies: [],
        potential_conflicts: []
      };

      // Analyze file-level dependencies
      const fileMap = new Map();
      for (const proposal of proposals) {
        const files = this.parseFiles(proposal.files);
        for (const file of files) {
          const key = file.path || file.name;
          if (!fileMap.has(key)) {
            fileMap.set(key, []);
          }
          fileMap.get(key).push(proposal.id);
        }
      }

      // Identify dependencies
      for (const [file, proposalIds] of fileMap.entries()) {
        if (proposalIds.length > 1) {
          dependencies.file_dependencies.push({
            file,
            proposals: proposalIds,
            type: 'shared_file_modification'
          });
        }
      }

      return dependencies;
    } catch (error) {
      logger.error('Failed to analyze dependencies:', error);
      return {};
    }
  }
}

export default UnificationService;
