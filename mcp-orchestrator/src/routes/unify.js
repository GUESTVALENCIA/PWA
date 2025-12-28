/**
 * Plan Unification Routes
 * POST /api/proposals/unify - Unify multiple proposals into one plan
 * POST /api/plans/:planId/approve - Approve a unified plan
 */

import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/proposals/unify
 * Unify multiple proposals into a single plan
 */
router.post('/proposals/unify', async (req, res, next) => {
  try {
    const { projectId, proposalIds, title, description, strategy } = req.body;
    const createdBy = req.agent?.id || 'system';

    const { unification: unificationService } = req.services;

    // Validate required fields
    if (!projectId || !proposalIds || proposalIds.length === 0) {
      return res.status(400).json({
        error: 'projectId and proposalIds array are required',
        received: { projectId, proposalIds }
      });
    }

    // Unify proposals using service
    const result = await unificationService.unifyProposals(projectId, proposalIds, {
      title: title || `Unified Plan from ${proposalIds.length} proposals`,
      description,
      strategy,
      createdBy
    });

    const { plan, merged_files } = result;

    logger.info(`✅ Plan unified: ${plan.id} from ${proposalIds.length} proposals`);

    res.status(201).json({
      id: plan.id,
      project_id: plan.project_id,
      status: plan.status,
      title: plan.title,
      proposal_count: proposalIds.length,
      merge_summary: {
        total_files: merged_files.totalFiles,
        conflicts: merged_files.conflictCount,
        requires_manual_review: merged_files.requiresManualReview
      },
      created_at: plan.created_at,
      message: 'Plan unified successfully'
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    logger.error('Failed to unify proposals:', error);
    next(error);
  }
});

/**
 * POST /api/plans/:planId/approve
 * Approve a unified plan for implementation
 */
router.post('/plans/:planId/approve', async (req, res, next) => {
  try {
    const { planId } = req.params;
    const { assignTo } = req.body;
    const approvalAgentId = req.agent?.id || 'system';

    const { unification: unificationService } = req.services;

    // Approve plan using service
    const plan = await unificationService.approvePlan(planId, approvalAgentId);

    // Assign implementer if provided
    if (assignTo) {
      await unificationService.assignImplementer(planId, assignTo);
    }

    // Generate report
    const report = await unificationService.generateUnificationReport(planId);

    logger.info(`✅ Plan ${planId} approved by ${approvalAgentId}`);

    res.json({
      id: plan.id,
      status: plan.status,
      approved_by: plan.approval_agent_id,
      approved_at: plan.approved_at,
      assigned_to: assignTo,
      report,
      message: 'Plan approved and ready for implementation'
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    logger.error('Failed to approve plan:', error);
    next(error);
  }
});

/**
 * GET /api/plans/:planId
 * Get plan details
 */
router.get('/plans/:planId', async (req, res, next) => {
  try {
    const { planId } = req.params;
    const { unification: unificationService } = req.services;

    const result = await unificationService.getPlanWithDetails(planId);
    const { plan, proposals, mergedContent } = result;

    res.json({
      id: plan.id,
      title: plan.title,
      description: plan.description,
      status: plan.status,
      created_at: plan.created_at,
      approved_at: plan.approved_at,
      approved_by: plan.approval_agent_id,
      assigned_implementer: plan.assigned_implementer_id,
      source_proposals: proposals.map(p => ({
        id: p.id,
        title: p.title,
        agent: p.agent_id
      })),
      merged_content: mergedContent
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    logger.error('Failed to get plan:', error);
    next(error);
  }
});

export default router;
