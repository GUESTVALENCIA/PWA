/**
 * Ruta de Revisiones de Propuestas
 * POST /api/proposals/:proposalId/review
 */

import express from 'express';
import { stateManager } from '../../server.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.post('/proposals/:proposalId/review', (req, res) => {
  try {
    const { proposalId } = req.params;
    const { assessment, suggestions, score, conflicts } = req.body;
    const reviewerAgent = req.agent?.id || 'unknown';

    const proposal = stateManager.getProposal(proposalId);
    if (!proposal) {
      return res.status(404).json({ error: 'Propuesta no encontrada' });
    }

    const review = {
      reviewer_agent: reviewerAgent,
      assessment,
      suggestions: suggestions || [],
      score: score || 5,
      conflicts: conflicts || [],
      created_at: new Date().toISOString()
    };

    stateManager.addReview(proposalId, review);

    // Actualizar status si hay múltiples reviews
    const currentProposal = stateManager.getProposal(proposalId);
    if (currentProposal.reviews.length >= 2) {
      stateManager.updateProposal(proposalId, { status: 'reviewed' });
    }

    // Broadcast
    stateManager.broadcastToAgents({
      type: 'review_added',
      proposalId,
      reviewer: reviewerAgent,
      score
    });

    logger.info(`✅ Revisión añadida a #${proposalId.substring(0, 8)} por ${reviewerAgent}`);

    res.status(201).json({
      reviewId: review.reviewer_agent,
      proposalId,
      status: currentProposal.status,
      message: '✅ Revisión registrada'
    });
  } catch (error) {
    logger.error('Error añadiendo revisión:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
