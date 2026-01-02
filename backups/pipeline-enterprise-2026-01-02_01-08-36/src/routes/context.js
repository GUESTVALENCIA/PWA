/**
 * Shared Context Routes
 * GET /api/projects/:projectId/context - Get project context
 * GET /api/projects/:projectId/sync - Get sync summary
 */

import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/projects/:projectId/context
 * Get complete project context for an agent
 */
router.get('/projects/:projectId/context', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const agentId = req.agent?.id || 'unknown';

    const { context: contextBuilder, neon: neonService } = req.services;

    if (!neonService) {
      return res.status(503).json({ error: 'Database service not available' });
    }

    // Build context
    const context = await contextBuilder.buildReadOnlyContext(projectId, agentId);

    res.json({
      project_id: projectId,
      agent_id: agentId,
      context,
      timestamp: new Date().toISOString(),
      permissions: {
        read: true,
        propose: context.lockStatus.status === 'unlocked' || context.lockStatus.locked_by === agentId,
        implement: context.lockStatus.locked_by === agentId
      }
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    logger.error('Failed to get context:', error);
    next(error);
  }
});

/**
 * GET /api/projects/:projectId/sync
 * Get lightweight sync summary for real-time updates
 */
router.get('/projects/:projectId/sync', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { context: contextBuilder, neon: neonService } = req.services;

    if (!neonService) {
      return res.json({
        timestamp: new Date().toISOString(),
        message: 'Database not available'
      });
    }

    // Build lightweight summary
    const summary = await contextBuilder.buildSyncSummary(projectId);

    res.json(summary);
  } catch (error) {
    logger.error('Failed to get sync summary:', error);
    next(error);
  }
});

/**
 * GET /api/projects/:projectId/proposals/count
 * Get count of proposals by status
 */
router.get('/projects/:projectId/proposals/count', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { proposal: proposalService } = req.services;

    const pendingProposals = await proposalService.getPendingProposals(projectId);
    const reviewedProposals = await proposalService.getReviewedProposals(projectId);
    const unifiableProposals = await proposalService.getUnifiableProposals(projectId);

    res.json({
      pending: pendingProposals.length,
      reviewed: reviewedProposals.length,
      ready_for_unification: unifiableProposals.length,
      total: pendingProposals.length + reviewedProposals.length
    });
  } catch (error) {
    logger.error('Failed to get proposal counts:', error);
    next(error);
  }
});

/**
 * GET /api/projects/:projectId/plans/count
 * Get count of plans by status
 */
router.get('/projects/:projectId/plans/count', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { unification: unificationService } = req.services;

    const pendingApprovalPlans = await unificationService.getPendingApprovalPlans(projectId);
    const approvedPlans = await unificationService.getApprovedPlans(projectId);

    res.json({
      pending_approval: pendingApprovalPlans.length,
      approved: approvedPlans.length,
      ready_for_implementation: approvedPlans.length
    });
  } catch (error) {
    logger.error('Failed to get plan counts:', error);
    next(error);
  }
});

export default router;
