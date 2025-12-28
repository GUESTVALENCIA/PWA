/**
 * Ruta de Propuestas
 * POST /api/projects/:projectId/propose - Crear propuesta
 * GET /api/proposals/:proposalId - Obtener propuesta
 * GET /api/proposals - Listar todas
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { projectManager, stateManager } from '../../server.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// POST /api/projects/:projectId/propose
router.post('/projects/:projectId/propose', (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, files, reasoning } = req.body;
    const agentId = req.agent?.id || 'unknown';

    const project = projectManager.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const proposal = {
      id: uuidv4(),
      project_id: projectId,
      agent_name: agentId,
      title,
      description,
      files: files || [],
      reasoning,
      status: 'pending'
    };

    stateManager.registerProposal(proposal);

    // Broadcast a agentes
    stateManager.broadcastToAgents({
      type: 'proposal_created',
      proposalId: proposal.id,
      projectId,
      agent: agentId
    });

    logger.info(`📋 Propuesta creada #${proposal.id.substring(0, 8)} por ${agentId}`);

    res.status(201).json({
      id: proposal.id,
      projectId: proposal.project_id,
      status: proposal.status,
      message: `✅ Propuesta creada`,
      viewUrl: `http://localhost:3000/proposals/${proposal.id}`
    });
  } catch (error) {
    logger.error('Error creando propuesta:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/proposals/:proposalId
router.get('/proposals/:proposalId', (req, res) => {
  try {
    const proposal = stateManager.getProposal(req.params.proposalId);

    if (!proposal) {
      return res.status(404).json({ error: 'Propuesta no encontrada' });
    }

    res.json({
      id: proposal.id,
      projectId: proposal.project_id,
      agentName: proposal.agent_name,
      title: proposal.title,
      description: proposal.description,
      files: proposal.files,
      reasoning: proposal.reasoning,
      status: proposal.status,
      reviews: proposal.reviews || [],
      created_at: proposal.created_at
    });
  } catch (error) {
    logger.error('Error obteniendo propuesta:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/proposals
router.get('/proposals', (req, res) => {
  try {
    const proposals = Array.from(stateManager.proposals.values());

    res.json({
      total: proposals.length,
      proposals: proposals.map(p => ({
        id: p.id,
        projectId: p.project_id,
        agent: p.agent_name,
        title: p.title,
        status: p.status,
        reviews: p.reviews?.length || 0
      }))
    });
  } catch (error) {
    logger.error('Error listando propuestas:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
