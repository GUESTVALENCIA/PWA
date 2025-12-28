/**
 * Proposal Service
 * Handles proposal creation, retrieval, and management logic
 */

import logger from '../utils/logger.js';

class ProposalService {
  constructor(neonService, stateManager, systemEventEmitter) {
    this.neonService = neonService;
    this.stateManager = stateManager;
    this.eventEmitter = systemEventEmitter;
  }

  /**
   * Create a new proposal from an agent
   */
  async createProposal(projectId, agentId, proposalData) {
    try {
      const { title, description, reasoning, files } = proposalData;

      // Validate required fields
      if (!title || !files || files.length === 0) {
        throw new Error('Title and files are required for a proposal');
      }

      // Create proposal in database
      const proposal = await this.neonService.createProposal(
        projectId,
        agentId,
        { title, description, reasoning, files }
      );

      // Update state manager
      this.stateManager.registerProposal(proposal);

      // Emit event for real-time sync
      this.eventEmitter.emitProposalCreated(projectId, proposal);

      logger.info(`✅ Proposal created: ${proposal.id} by ${agentId}`);
      return proposal;
    } catch (error) {
      logger.error('Failed to create proposal:', error);
      throw error;
    }
  }

  /**
   * Get proposal with all details and reviews
   */
  async getProposalWithReviews(proposalId) {
    try {
      const proposal = await this.neonService.getProposal(proposalId);
      if (!proposal) {
        throw new Error(`Proposal ${proposalId} not found`);
      }

      // Get all reviews for this proposal
      const reviews = await this.neonService.getProposalReviews(proposalId);

      return {
        ...proposal,
        reviews: reviews || [],
        review_count: reviews.length
      };
    } catch (error) {
      logger.error('Failed to get proposal with reviews:', error);
      throw error;
    }
  }

  /**
   * Get all proposals for a project
   */
  async getProjectProposals(projectId, status = null) {
    try {
      const proposals = await this.neonService.getProjectProposals(projectId, status);
      return proposals || [];
    } catch (error) {
      logger.error('Failed to get project proposals:', error);
      throw error;
    }
  }

  /**
   * Get pending proposals (awaiting review)
   */
  async getPendingProposals(projectId) {
    return this.getProjectProposals(projectId, 'pending');
  }

  /**
   * Get reviewed proposals (ready for unification)
   */
  async getReviewedProposals(projectId) {
    return this.getProjectProposals(projectId, 'reviewed');
  }

  /**
   * Update proposal status
   */
  async updateProposalStatus(proposalId, newStatus) {
    try {
      const proposal = await this.neonService.updateProposalStatus(proposalId, newStatus);
      if (!proposal) {
        throw new Error(`Proposal ${proposalId} not found`);
      }

      // Update state manager
      this.stateManager.updateProposal(proposalId, { status: newStatus });

      logger.info(`Proposal ${proposalId} status updated to ${newStatus}`);
      return proposal;
    } catch (error) {
      logger.error('Failed to update proposal status:', error);
      throw error;
    }
  }

  /**
   * Calculate approval score from reviews
   */
  async calculateApprovalScore(proposalId) {
    try {
      const reviews = await this.neonService.getReviewsWithScore(proposalId);

      if (reviews.length === 0) {
        return null;
      }

      const scores = reviews.map(r => r.score).filter(s => s !== null);
      if (scores.length === 0) return null;

      const average = scores.reduce((a, b) => a + b, 0) / scores.length;
      const roundedScore = Math.round(average * 10) / 10;

      // Update proposal with calculated score
      await this.neonService.updateProposalScore(proposalId, roundedScore);

      return roundedScore;
    } catch (error) {
      logger.error('Failed to calculate approval score:', error);
      return null;
    }
  }

  /**
   * Check if a proposal can be unified
   * (has 2+ reviews and average score >= 6.0)
   */
  async canBeUnified(proposalId) {
    try {
      const proposal = await this.neonService.getProposal(proposalId);
      if (!proposal) return false;

      const reviews = await this.neonService.getReviewsWithScore(proposalId);

      // Require at least 2 reviews
      if (reviews.length < 2) {
        return false;
      }

      // Calculate average score
      const scores = reviews.map(r => r.score);
      const average = scores.reduce((a, b) => a + b, 0) / scores.length;

      // Require average score >= 6.0
      return average >= 6.0;
    } catch (error) {
      logger.error('Failed to check unification eligibility:', error);
      return false;
    }
  }

  /**
   * Get proposals ready for unification
   */
  async getUnifiableProposals(projectId) {
    try {
      const proposals = await this.getReviewedProposals(projectId);

      const unifiableProposals = [];
      for (const proposal of proposals) {
        if (await this.canBeUnified(proposal.id)) {
          unifiableProposals.push(proposal);
        }
      }

      return unifiableProposals;
    } catch (error) {
      logger.error('Failed to get unifiable proposals:', error);
      return [];
    }
  }

  /**
   * Merge proposal files intelligently
   * Detects conflicts and combines changes
   */
  mergeProposalFiles(proposals) {
    try {
      const fileMap = new Map();

      // Collect all files from all proposals
      for (const proposal of proposals) {
        const files = JSON.parse(
          typeof proposal.files === 'string' ? proposal.files : JSON.stringify(proposal.files)
        );

        for (const file of files) {
          const key = file.path || file.name;

          if (!fileMap.has(key)) {
            fileMap.set(key, {
              path: file.path || file.name,
              sources: [],
              conflicts: []
            });
          }

          fileMap.get(key).sources.push({
            proposalId: proposal.id,
            agentId: proposal.agent_id,
            content: file.content,
            changes: file.changes || []
          });
        }
      }

      // Detect conflicts (multiple modifications to same file)
      const mergedFiles = [];
      for (const [path, fileData] of fileMap.entries()) {
        if (fileData.sources.length > 1) {
          fileData.conflicts.push({
            type: 'multiple_modifications',
            count: fileData.sources.length,
            message: `File modified by ${fileData.sources.length} different proposals`
          });
        }

        mergedFiles.push({
          path,
          sourceCount: fileData.sources.length,
          proposals: fileData.sources.map(s => ({
            proposalId: s.proposalId,
            agentId: s.agentId
          })),
          conflicts: fileData.conflicts.length > 0 ? fileData.conflicts : null,
          requiresManualMerge: fileData.conflicts.length > 0
        });
      }

      return mergedFiles;
    } catch (error) {
      logger.error('Failed to merge proposal files:', error);
      return [];
    }
  }

  /**
   * Generate summary of proposal for display
   */
  async generateProposalSummary(proposalId) {
    try {
      const proposal = await this.getProposalWithReviews(proposalId);
      const scores = proposal.reviews
        .filter(r => r.score !== null)
        .map(r => r.score);

      const avgScore = scores.length > 0
        ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
        : 'N/A';

      return {
        id: proposal.id,
        title: proposal.title,
        agent: proposal.agent_id,
        status: proposal.status,
        createdAt: proposal.created_at,
        fileCount: JSON.parse(
          typeof proposal.files === 'string' ? proposal.files : JSON.stringify(proposal.files)
        ).length,
        reviewCount: proposal.reviews.length,
        approvalScore: avgScore,
        reviewers: proposal.reviews.map(r => r.reviewer_agent_id)
      };
    } catch (error) {
      logger.error('Failed to generate proposal summary:', error);
      throw error;
    }
  }

  /**
   * Export proposal as JSON for sharing between agents
   */
  async exportProposal(proposalId) {
    try {
      const proposal = await this.getProposalWithReviews(proposalId);
      const score = await this.calculateApprovalScore(proposalId);

      return {
        proposal: {
          id: proposal.id,
          title: proposal.title,
          description: proposal.description,
          reasoning: proposal.reasoning,
          agent_id: proposal.agent_id,
          created_at: proposal.created_at,
          status: proposal.status,
          files: JSON.parse(
            typeof proposal.files === 'string' ? proposal.files : JSON.stringify(proposal.files)
          ),
          approval_score: score
        },
        reviews: proposal.reviews.map(r => ({
          reviewer_id: r.reviewer_agent_id,
          assessment: r.assessment,
          score: r.score,
          status: r.status,
          created_at: r.created_at
        }))
      };
    } catch (error) {
      logger.error('Failed to export proposal:', error);
      throw error;
    }
  }
}

export default ProposalService;
