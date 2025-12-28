/**
 * Read-Only Routes
 * GET /api/projects/:projectId/read - Get read-only project information
 */

import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/projects/:projectId/read
 * Get read-only access to project information
 */
router.get('/projects/:projectId/read', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const agentId = req.agent?.id || 'unknown';

    const { project: projectManager, neon: neonService } = req.services;

    // Get project
    const project = projectManager.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get lock status if database available
    let lockStatus = { status: 'unknown' };
    if (neonService) {
      lockStatus = await neonService.checkProjectLock(projectId) || { status: 'unlocked' };
    }

    res.json({
      id: project.id,
      name: project.name,
      path: project.path,
      status: project.status,
      lock_status: lockStatus.status,
      locked_by: lockStatus.locked_by || null,
      locked_at: lockStatus.locked_at || null,
      permissions: {
        read: true,
        propose: lockStatus.status === 'unlocked' || lockStatus.locked_by === agentId,
        implement: lockStatus.locked_by === agentId
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to read project:', error);
    next(error);
  }
});

export default router;
