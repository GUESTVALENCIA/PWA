/**
 * Ruta de Unificación de Propuestas
 * POST /api/proposals/unify
 * POST /api/plans/:planId/approve
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { stateManager } from '../../server.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.post('/proposals/unify', (req, res) => {
  try {
    const { projectId, proposalIds, strategy } = req.body;
    const createdBy = req.agent?.id || 'system';

    if (!proposalIds || proposalIds.length === 0) {
      return res.status(400).json({ error: 'proposalIds requerido' });
    }

    const proposals = proposalIds.map(id => stateManager.getProposal(id)).filter(Boolean);

    if (proposals.length === 0) {
      return res.status(404).json({ error: 'No proposals found' });
    }

    // Generar plan unificado
    const plan = {
      id: uuidv4(),
      project_id: projectId || proposals[0].project_id,
      proposal_ids: proposalIds,
      created_by: createdBy,
      status: 'pending',
      final_plan: {
        files: [],
        description: `Plan unificado de ${proposals.length} propuestas`,
        strategy: strategy || 'merge_best_practices',
        timestamp: new Date().toISOString()
      }
    };

    stateManager.registerPlan(plan);

    // Actualizar propuestas
    proposalIds.forEach(id => {
      stateManager.updateProposal(id, { status: 'unified' });
    });

    logger.info(`🎯 Plan unificado #${plan.id.substring(0, 8)} creado por ${createdBy}`);

    res.status(201).json({
      planId: plan.id,
      projectId: plan.project_id,
      status: plan.status,
      proposalsCount: proposals.length,
      message: '✅ Plan unificado creado'
    });
  } catch (error) {
    logger.error('Error unificando propuestas:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/plans/:planId/approve
router.post('/plans/:planId/approve', (req, res) => {
  try {
    const { planId } = req.params;
    const { approvedBy } = req.body;

    const plan = stateManager.getPlan(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    const updated = stateManager.updatePlan(planId, {
      status: 'approved',
      approved_by: approvedBy || req.agent?.id,
      approved_at: new Date().toISOString()
    });

    // Broadcast
    stateManager.broadcastToAgents({
      type: 'plan_approved',
      planId,
      approvedBy
    });

    logger.info(`✅ Plan #${planId.substring(0, 8)} aprobado`);

    res.json({
      planId: updated.id,
      status: updated.status,
      message: '✅ Plan aprobado. Listo para implementación.'
    });
  } catch (error) {
    logger.error('Error aprobando plan:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
