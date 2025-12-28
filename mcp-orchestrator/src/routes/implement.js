/**
 * Ruta de Implementación
 * POST /api/plans/:planId/implement
 * POST /api/implementations/:implementationId/complete
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { projectManager, stateManager } from '../../server.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.post('/plans/:planId/implement', (req, res) => {
  try {
    const { planId } = req.params;
    const { agentId } = req.body;
    const requestingAgent = agentId || req.agent?.id;

    const plan = stateManager.getPlan(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    if (plan.status !== 'approved') {
      return res.status(400).json({ error: 'Plan no está aprobado' });
    }

    const projectId = plan.project_id;

    // Bloquear proyecto
    projectManager.lockProject(projectId, requestingAgent);

    const implementation = {
      id: uuidv4(),
      plan_id: planId,
      implemented_by: requestingAgent,
      status: 'in_progress',
      timestamp: new Date().toISOString()
    };

    stateManager.registerPlan({ ...plan, status: 'implementing', implementing_by: requestingAgent });

    // Broadcast
    stateManager.broadcastToAgents({
      type: 'implementation_started',
      planId,
      projectId,
      implementedBy: requestingAgent,
      locked: true
    });

    logger.info(`🔒 Implementación iniciada #${implementation.id.substring(0, 8)} por ${requestingAgent}`);

    res.status(201).json({
      implementationId: implementation.id,
      planId,
      status: 'implementing',
      message: `🔒 Proyecto bloqueado para ${requestingAgent}. Implementando...`,
      timeout: '30 minutos'
    });
  } catch (error) {
    logger.error('Error iniciando implementación:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/implementations/:implementationId/complete
router.post('/implementations/:implementationId/complete', (req, res) => {
  try {
    const { filesChanged, testsPassed, summary } = req.body;
    const implementingAgent = req.agent?.id;

    // Encontrar plan desde implementation ID (simplificado)
    let plan = null;
    for (const [_, p] of stateManager.plans) {
      if (p.implementing_by === implementingAgent) {
        plan = p;
        break;
      }
    }

    if (!plan) {
      return res.status(404).json({ error: 'Plan de implementación no encontrado' });
    }

    const projectId = plan.project_id;

    // Desbloquear proyecto
    projectManager.unlockProject(projectId);

    // Actualizar plan
    const updated = stateManager.updatePlan(plan.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      files_changed: filesChanged,
      tests_passed: testsPassed,
      summary
    });

    // Actualizar contexto del proyecto
    projectManager.updateProjectContext(projectId, {
      lastChanges: {
        date: new Date().toISOString(),
        files: filesChanged,
        implementedBy: implementingAgent,
        summary: summary
      }
    });

    // Broadcast
    stateManager.broadcastToAgents({
      type: 'implementation_completed',
      planId: plan.id,
      projectId,
      completedBy: implementingAgent,
      filesChanged,
      locked: false
    });

    logger.info(`✅ Implementación completada - Proyecto desbloqueado`);

    res.json({
      status: 'completed',
      projectId,
      message: '✅ Implementación completada. Proyecto desbloqueado.',
      filesChanged: filesChanged?.length || 0,
      testsPassed
    });
  } catch (error) {
    logger.error('Error completando implementación:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
