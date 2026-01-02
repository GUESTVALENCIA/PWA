/**
 * Project Routes
 * GET /api/projects - List all projects
 * POST /api/projects - Create new project
 * GET /api/projects/:projectId - Get project details
 */

import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/projects
 * List all projects
 */
router.get('/', async (req, res, next) => {
  try {
    const { project: projectManager, neon: neonService } = req.services;

    const projects = projectManager.listProjects();

    // Enrich with database info if available
    const enrichedProjects = await Promise.all(
      projects.map(async (p) => {
        if (neonService) {
          const lockStatus = await neonService.checkProjectLock(p.id);
          return {
            id: p.id,
            name: p.name,
            path: p.path,
            status: p.status,
            lock_status: lockStatus?.lock_status || p.lock_status,
            locked_by: lockStatus?.locked_by || null,
            created_at: p.created_at,
            updated_at: p.updated_at
          };
        }
        return {
          id: p.id,
          name: p.name,
          path: p.path,
          status: p.status,
          lock_status: p.lock_status,
          created_at: p.created_at,
          updated_at: p.updated_at
        };
      })
    );

    res.json({
      count: enrichedProjects.length,
      projects: enrichedProjects
    });
  } catch (error) {
    logger.error('Failed to list projects:', error);
    next(error);
  }
});

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, path, description } = req.body;
    const createdBy = req.agent?.id || 'system';

    const { project: projectManager, neon: neonService } = req.services;

    // Validate required fields
    if (!name || !path) {
      return res.status(400).json({
        error: 'name and path are required',
        received: { name, path }
      });
    }

    // Create project
    const project = projectManager.createProject(name, path);

    // Create in database if available
    if (neonService) {
      try {
        await neonService.createProject({
          name: project.name,
          path: project.path,
          description,
          createdBy
        });
      } catch (dbError) {
        logger.warn('Failed to store project in database:', dbError.message);
        // Continue - project is still created in memory
      }
    }

    logger.info(`✅ Project created: ${project.id} - ${name}`);

    res.status(201).json({
      id: project.id,
      name: project.name,
      path: project.path,
      status: project.status,
      created_at: project.created_at,
      message: `Project created successfully`
    });
  } catch (error) {
    logger.error('Failed to create project:', error);
    next(error);
  }
});

/**
 * GET /api/projects/:projectId
 * Get project details
 */
router.get('/:projectId', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { project: projectManager, neon: neonService, context: contextBuilder } = req.services;

    // Get project
    const project = projectManager.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get lock status if database available
    let lockStatus = { lock_status: project.lock_status, locked_by: null };
    if (neonService) {
      lockStatus = await neonService.checkProjectLock(projectId) || lockStatus;
    }

    // Build context if database available
    let context = null;
    if (neonService && contextBuilder) {
      try {
        context = await contextBuilder.buildProjectContext(projectId);
      } catch (contextError) {
        logger.warn('Failed to build context:', contextError.message);
      }
    }

    res.json({
      id: project.id,
      name: project.name,
      path: project.path,
      status: project.status,
      lock_status: lockStatus.lock_status,
      locked_by: lockStatus.locked_by,
      description: project.description || null,
      created_at: project.created_at,
      updated_at: project.updated_at,
      context
    });
  } catch (error) {
    logger.error('Failed to get project:', error);
    next(error);
  }
});

export default router;
