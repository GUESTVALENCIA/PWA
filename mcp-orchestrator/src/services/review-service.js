/**
 * Review Service
 * Handles proposal review creation and management
 */

import logger from '../utils/logger.js';

class ReviewService {
  constructor(neonService, stateManager, systemEventEmitter) {
    this.neonService = neonService;
    this.stateManager = stateManager;
    this.eventEmitter = systemEventEmitter;
  }

  /**
   * Create a review for a proposal
   */
  async createReview(proposalId, reviewerAgentId, reviewData) {
    try {
      const { assessment, suggestions, score, status } = reviewData;

      // Validate required fields
      if (!assessment) {
        throw new Error('Assessment is required for a review');
      }

      // Validate score if provided
      if (score !== null && score !== undefined) {
        if (score < 0 || score > 10) {
          throw new Error('Score must be between 0 and 10');
        }
      }

      // Create review in database
      const review = await this.neonService.createReview(
        proposalId,
        reviewerAgentId,
        { assessment, suggestions, score, status }
      );

      // Update state manager
      this.stateManager.addReview(proposalId, review);

      // Get proposal for context
      const proposal = await this.neonService.getProposal(proposalId);

      // Update proposal status to 'reviewed' if not already
      if (proposal.status === 'pending') {
        await this.neonService.updateProposalStatus(proposalId, 'reviewed');
      }

      // Emit event for real-time sync
      this.eventEmitter.emitReviewCreated(proposal.project_id, proposalId, review);

      logger.info(`✅ Review created for proposal ${proposalId} by ${reviewerAgentId}`);
      return review;
    } catch (error) {
      logger.error('Failed to create review:', error);
      throw error;
    }
  }

  /**
   * Get all reviews for a proposal
   */
  async getProposalReviews(proposalId) {
    try {
      const reviews = await this.neonService.getProposalReviews(proposalId);
      return reviews || [];
    } catch (error) {
      logger.error('Failed to get proposal reviews:', error);
      throw error;
    }
  }

  /**
   * Get reviews with scores only
   */
  async getReviewsWithScores(proposalId) {
    try {
      const reviews = await this.neonService.getReviewsWithScore(proposalId);
      return reviews || [];
    } catch (error) {
      logger.error('Failed to get reviews with scores:', error);
      throw error;
    }
  }

  /**
   * Calculate average review score for a proposal
   */
  async calculateAverageScore(proposalId) {
    try {
      const reviews = await this.getReviewsWithScores(proposalId);

      if (reviews.length === 0) {
        return null;
      }

      const total = reviews.reduce((sum, review) => sum + review.score, 0);
      const average = total / reviews.length;

      return Math.round(average * 10) / 10; // Round to 1 decimal
    } catch (error) {
      logger.error('Failed to calculate average score:', error);
      return null;
    }
  }

  /**
   * Generate review summary for a proposal
   */
  async generateReviewSummary(proposalId) {
    try {
      const reviews = await this.getProposalReviews(proposalId);
      const scores = await this.getReviewsWithScores(proposalId);

      const avgScore = scores.length > 0
        ? await this.calculateAverageScore(proposalId)
        : null;

      const statuses = {};
      for (const review of reviews) {
        statuses[review.status] = (statuses[review.status] || 0) + 1;
      }

      return {
        total_reviews: reviews.length,
        reviews_with_scores: scores.length,
        average_score: avgScore,
        status_breakdown: statuses,
        reviewers: reviews.map(r => r.reviewer_agent_id),
        approved_count: reviews.filter(r => r.status === 'approved').length,
        rejected_count: reviews.filter(r => r.status === 'rejected').length,
        changes_suggested_count: reviews.filter(r => r.status === 'suggested_changes').length
      };
    } catch (error) {
      logger.error('Failed to generate review summary:', error);
      throw error;
    }
  }

  /**
   * Get consensus opinion from reviews
   * Returns: 'approve', 'needs_changes', 'reject', or 'unclear'
   */
  async getReviewConsensus(proposalId) {
    try {
      const reviews = await this.getProposalReviews(proposalId);

      if (reviews.length === 0) {
        return 'unclear';
      }

      const statuses = {
        approved: 0,
        rejected: 0,
        suggested_changes: 0
      };

      for (const review of reviews) {
        if (statuses.hasOwnProperty(review.status)) {
          statuses[review.status]++;
        }
      }

      const total = reviews.length;
      const approvedPercent = statuses.approved / total;
      const rejectedPercent = statuses.rejected / total;
      const changesPercent = statuses.suggested_changes / total;

      // Decision logic
      if (approvedPercent >= 0.7) {
        return 'approve';
      } else if (rejectedPercent >= 0.5) {
        return 'reject';
      } else if (changesPercent >= 0.5) {
        return 'needs_changes';
      } else {
        return 'unclear';
      }
    } catch (error) {
      logger.error('Failed to get review consensus:', error);
      return 'unclear';
    }
  }

  /**
   * Check if a proposal should proceed to unification
   * (has 2+ reviews, avg score >= 6.0, and positive consensus)
   */
  async isReadyForUnification(proposalId) {
    try {
      const reviews = await this.getProposalReviews(proposalId);

      // Need at least 2 reviews
      if (reviews.length < 2) {
        return false;
      }

      const avgScore = await this.calculateAverageScore(proposalId);

      // Need average score >= 6.0
      if (avgScore === null || avgScore < 6.0) {
        return false;
      }

      const consensus = await this.getReviewConsensus(proposalId);

      // Consensus must be approve or needs_changes (not reject)
      return consensus === 'approve' || consensus === 'needs_changes';
    } catch (error) {
      logger.error('Failed to check unification readiness:', error);
      return false;
    }
  }

  /**
   * Extract all suggestions from reviews
   */
  async extractAllSuggestions(proposalId) {
    try {
      const reviews = await this.getProposalReviews(proposalId);

      const allSuggestions = [];
      for (const review of reviews) {
        if (review.suggestions) {
          const suggestions = typeof review.suggestions === 'string'
            ? JSON.parse(review.suggestions)
            : review.suggestions;

          if (Array.isArray(suggestions)) {
            for (const suggestion of suggestions) {
              allSuggestions.push({
                from_agent: review.reviewer_agent_id,
                suggestion: suggestion,
                created_at: review.created_at
              });
            }
          }
        }
      }

      return allSuggestions;
    } catch (error) {
      logger.error('Failed to extract suggestions:', error);
      return [];
    }
  }

  /**
   * Export review data as JSON
   */
  async exportReviews(proposalId) {
    try {
      const reviews = await this.getProposalReviews(proposalId);
      const summary = await this.generateReviewSummary(proposalId);
      const consensus = await this.getReviewConsensus(proposalId);
      const suggestions = await this.extractAllSuggestions(proposalId);

      return {
        proposal_id: proposalId,
        summary,
        consensus,
        suggestions,
        reviews: reviews.map(r => ({
          id: r.id,
          reviewer_agent_id: r.reviewer_agent_id,
          assessment: r.assessment,
          score: r.score,
          status: r.status,
          created_at: r.created_at
        }))
      };
    } catch (error) {
      logger.error('Failed to export reviews:', error);
      throw error;
    }
  }

  /**
   * Get comparative analysis of reviews
   */
  async getComparativeAnalysis(proposalId) {
    try {
      const reviews = await this.getProposalReviews(proposalId);

      if (reviews.length === 0) {
        return null;
      }

      const analysisData = {
        total_reviews: reviews.length,
        score_distribution: {},
        status_distribution: {},
        reviewer_details: [],
        agreement_level: 'unknown'
      };

      // Score distribution
      for (const review of reviews) {
        if (review.score !== null) {
          const scoreRange = Math.floor(review.score);
          analysisData.score_distribution[scoreRange] =
            (analysisData.score_distribution[scoreRange] || 0) + 1;
        }
      }

      // Status distribution
      for (const review of reviews) {
        analysisData.status_distribution[review.status] =
          (analysisData.status_distribution[review.status] || 0) + 1;
      }

      // Reviewer details
      for (const review of reviews) {
        analysisData.reviewer_details.push({
          agent_id: review.reviewer_agent_id,
          score: review.score,
          status: review.status,
          assessment_length: review.assessment.length
        });
      }

      // Calculate agreement level
      const scores = reviews.filter(r => r.score !== null).map(r => r.score);
      if (scores.length > 1) {
        const scoreVariance = this.calculateVariance(scores);
        if (scoreVariance < 1) {
          analysisData.agreement_level = 'high';
        } else if (scoreVariance < 2.5) {
          analysisData.agreement_level = 'moderate';
        } else {
          analysisData.agreement_level = 'low';
        }
      }

      return analysisData;
    } catch (error) {
      logger.error('Failed to get comparative analysis:', error);
      throw error;
    }
  }

  /**
   * Helper: Calculate variance of scores
   */
  calculateVariance(scores) {
    if (scores.length === 0) return 0;

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;

    return Math.sqrt(variance); // Return standard deviation
  }
}

export default ReviewService;
