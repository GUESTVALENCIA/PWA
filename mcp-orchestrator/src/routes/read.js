/**
 * Ruta de Lectura (READ ONLY)
 * GET /api/projects/:projectId/read
 */

import express from 'express';
import { projectManager, stateManager } from '../../server.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.get('/projects/:projectId/read', (req, res) => {
  try {
    const { projectId } = req.params;
    const project = projectManager.getProject(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const proposals = Array.from(stateManager.proposals.values())
      .filter(p => p.project_id === projectId);

    res.json({
      projectId: project.id,
      name: project.name,
      status: project.status,
      lock_status: project.lock_status,
      permissions: {
        read: true,
        propose: !projectManager.isProjectLocked(projectId),
        implement: false
      },
      context: project.context,
      activeProposals: proposals.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error en READ:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
