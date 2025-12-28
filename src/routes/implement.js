/**
 * Implementation Routes
 * POST /api/plans/:planId/implement - Start implementation
 * POST /api/implementations/:implementationId/complete - Complete implementation
 * GET /api/implementations/:implementationId - Get implementation status
 */

import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/plans/:planId/implement
 * Start implementing an approved plan
 */
router.post('/plans/:planId/implement', async (req, res, next) => {
  try {
    const { planId } = req.params;
    const implementingAgentId = req.agent?.id || 'unknown';

    const { implementation: implementationService } = req.services;

    // Start implementation
    const result = await implementationService.startImplementation(
      planId,
      null, // projectId will be resolved in service
      implementingAgentId
    );

    const { implementation, lockInfo } = result;

    logger.info(`✅ Implementation started: ${implementation.id} by ${implementingAgentId}`);

    res.status(201).json({
      id: implementation.id,
      plan_id: implementation.plan_id,
      agent_id: implementation.agent_id,
      status: implementation.status,
      lock: lockInfo,
      message: `Project locked for implementation. Timeout: 30 minutes`,
      started_at: implementation.start_time
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('not approved')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('already locked')) {
      return res.status(409).json({ error: error.message });
    }
    logger.error('Failed to start implementation:', error);
    next(error);
  }
});

/**
 * POST /api/implementations/:implementationId/complete
 * Mark implementation as complete
 */
router.post('/implementations/:implementationId/complete', async (req, res, next) => {
  try {
    const { implementationId } = req.params;
    const { filesChanged, testResults } = req.body;

    const { implementation: implementationService } = req.services;

    // Get implementation to get projectId
    let implementation = await implementationService.getImplementationStatus(implementationId);
    if (!implementation) {
      return res.status(404).json({ error: 'Implementation not found' });
    }

    // Get project ID from plan (need to fetch implementation first to get plan)
    const impl = await implementationService.neonService.getImplementation(implementationId);
    if (!impl) {
      return res.status(404).json({ error: 'Implementation not found' });
    }

    // Complete implementation
    const completed = await implementationService.completeImplementation(
      implementationId,
      impl.project_id,
      { filesChanged, testResults }
    );

    // Generate report
    const report = await implementationService.generateImplementationReport(implementationId);

    logger.info(`✅ Implementation completed: ${implementationId}`);

    res.json({
      id: completed.id,
      status: completed.status,
      completed_at: completed.updated_at,
      report,
      message: 'Implementation completed successfully. Project unlocked.'
    });
  } catch (error) {
    logger.error('Failed to complete implementation:', error);
    next(error);
  }
});

/**
 * POST /api/implementations/:implementationId/progress
 * Record progress during implementation
 */
router.post('/implementations/:implementationId/progress', async (req, res, next) => {
  try {
    const { implementationId } = req.params;
    const { filesChanged, testResults } = req.body;

    const { implementation: implementationService } = req.services;

    // Record progress
    const updated = await implementationService.recordProgress(implementationId, {
      filesChanged,
      testResults
    });

    logger.info(`Implementation ${implementationId} progress recorded`);

    res.json({
      id: updated.id,
      status: updated.status,
      files_changed: filesChanged?.length || 0,
      message: 'Progress recorded'
    });
  } catch (error) {
    logger.error('Failed to record implementation progress:', error);
    next(error);
  }
});

/**
 * POST /api/implementations/:implementationId/fail
 * Mark implementation as failed
 */
router.post('/implementations/:implementationId/fail', async (req, res, next) => {
  try {
    const { implementationId } = req.params;
    const { errorDetails } = req.body;

    const { implementation: implementationService } = req.services;

    // Get implementation to get projectId
    const impl = await implementationService.neonService.getImplementation(implementationId);
    if (!impl) {
      return res.status(404).json({ error: 'Implementation not found' });
    }

    // Mark as failed
    const failed = await implementationService.failImplementation(
      implementationId,
      impl.project_id,
      errorDetails
    );

    logger.error(`Implementation ${implementationId} marked as failed`);

    res.status(400).json({
      id: failed.id,
      status: failed.status,
      error_logs: failed.error_logs,
      message: 'Implementation failed. Project unlocked.'
    });
  } catch (error) {
    logger.error('Failed to mark implementation as failed:', error);
    next(error);
  }
});

/**
 * GET /api/implementations/:implementationId
 * Get implementation status and details
 */
router.get('/implementations/:implementationId', async (req, res, next) => {
  try {
    const { implementationId } = req.params;
    const { implementation: implementationService } = req.services;

    const status = await implementationService.getImplementationStatus(implementationId);
    if (!status) {
      return res.status(404).json({ error: 'Implementation not found' });
    }

    res.json(status);
  } catch (error) {
    logger.error('Failed to get implementation status:', error);
    next(error);
  }
});

export default router;
