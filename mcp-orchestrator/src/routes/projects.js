/**
 * Rutas de Proyectos
 * GET /api/projects - Listar todos
 * POST /api/projects - Crear nuevo
 * GET /api/projects/:projectId - Detalles
 */

import express from 'express';
import { projectManager } from '../../server.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// GET /api/projects
router.get('/', (req, res) => {
  try {
    const projects = projectManager.listProjects();
    res.json({
      count: projects.length,
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        lock_status: p.lock_status,
        updated_at: p.updated_at
      }))
    });
  } catch (error) {
    logger.error('Error listando proyectos:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects
router.post('/', (req, res) => {
  try {
    const { name, path } = req.body;

    if (!name || !path) {
      return res.status(400).json({ error: 'name y path son requeridos' });
    }

    const project = projectManager.createProject(name, path);
    res.status(201).json({
      id: project.id,
      name: project.name,
      message: `✅ Proyecto creado: ${name}`
    });
  } catch (error) {
    logger.error('Error creando proyecto:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/projects/:projectId
router.get('/:projectId', (req, res) => {
  try {
    const project = projectManager.getProject(req.params.projectId);

    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    res.json({
      id: project.id,
      name: project.name,
      status: project.status,
      lock_status: project.lock_status,
      locked_by_agent: project.locked_by_agent,
      context: project.context,
      updated_at: project.updated_at
    });
  } catch (error) {
    logger.error('Error obteniendo proyecto:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
