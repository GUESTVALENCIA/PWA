/**
 * Proposal Review Routes
 * POST /api/proposals/:proposalId/review - Submit review
 * GET /api/proposals/:proposalId/reviews - Get all reviews
 */

import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/proposals/:proposalId/review
 * Submit a review for a proposal
 */
router.post('/proposals/:proposalId/review', async (req, res, next) => {
  try {
    const { proposalId } = req.params;
    const { assessment, suggestions, score, status } = req.body;
    const reviewerAgentId = req.agent?.id || 'unknown';

    const { review: reviewService } = req.services;

    // Validate required fields
    if (!assessment) {
      return res.status(400).json({
        error: 'Assessment is required',
        received: req.body
      });
    }

    // Validate score if provided
    if (score !== null && score !== undefined) {
      if (score < 0 || score > 10) {
        return res.status(400).json({ error: 'Score must be between 0 and 10' });
      }
    }

    // Create review using service
    const review = await reviewService.createReview(proposalId, reviewerAgentId, {
      assessment,
      suggestions,
      score,
      status: status || 'pending'
    });

    // Get summary of reviews for proposal
    const summary = await reviewService.generateReviewSummary(proposalId);

    logger.info(`✅ Review created for proposal ${proposalId} by ${reviewerAgentId}`);

    res.status(201).json({
      id: review.id,
      proposal_id: review.proposal_id,
      reviewer_agent_id: review.reviewer_agent_id,
      score: review.score,
      status: review.status,
      created_at: review.created_at,
      proposal_summary: summary
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    logger.error('Failed to create review:', error);
    next(error);
  }
});

/**
 * GET /api/proposals/:proposalId/reviews
 * Get all reviews for a proposal
 */
router.get('/proposals/:proposalId/reviews', async (req, res, next) => {
  try {
    const { proposalId } = req.params;
    const { review: reviewService } = req.services;

    const reviews = await reviewService.getProposalReviews(proposalId);
    const summary = await reviewService.generateReviewSummary(proposalId);
    const consensus = await reviewService.getReviewConsensus(proposalId);

    res.json({
      proposal_id: proposalId,
      total_reviews: reviews.length,
      reviews: reviews.map(r => ({
        id: r.id,
        reviewer_agent_id: r.reviewer_agent_id,
        assessment: r.assessment,
        score: r.score,
        status: r.status,
        suggestions: r.suggestions,
        created_at: r.created_at
      })),
      summary,
      consensus
    });
  } catch (error) {
    logger.error('Failed to get reviews:', error);
    next(error);
  }
});

export default router;
