/**
 * Ruta de Contexto Compartido
 * GET /api/projects/:projectId/context
 */

import express from 'express';
import { projectManager, stateManager } from '../../server.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.get('/projects/:projectId/context', (req, res) => {
  try {
    const { projectId } = req.params;
    const agentId = req.agent?.id;

    const project = projectManager.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const isLocked = projectManager.isProjectLocked(projectId, agentId);
    const lock = projectManager.getProjectLock(projectId);

    const activeProposals = Array.from(stateManager.proposals.values())
      .filter(p => p.project_id === projectId && p.status === 'pending');

    res.json({
      projectId: project.id,
      name: project.name,
      currentState: isLocked ? 'locked' : 'available',
      lastChanges: project.context.lastChanges || null,
      activeProposals: activeProposals.length,
      permissions: {
        read: true,
        propose: !isLocked || (isLocked && lock?.agent === agentId),
        implement: isLocked && lock?.agent === agentId
      },
      ...(isLocked && {
        lockedBy: lock.agent,
        lockTimeout: new Date(lock.timeout).toISOString()
      }),
      context: project.context,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error obteniendo contexto:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
