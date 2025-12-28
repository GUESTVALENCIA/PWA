/**
 * Proposal Routes
 * POST /api/projects/:projectId/propose - Create proposal
 * GET /api/proposals/:proposalId - Get proposal with reviews
 * GET /api/proposals - List all proposals
 */

import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/projects/:projectId/propose
 * Create a new proposal for a project
 */
router.post('/projects/:projectId/propose', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, files, reasoning } = req.body;
    const agentId = req.agent?.id || 'unknown';

    const { proposal: proposalService, project: projectManager } = req.services;

    // Verify project exists
    const project = projectManager.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Validate required fields
    if (!title || !files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        error: 'Title and files array are required',
        received: { title, files }
      });
    }

    // Create proposal using service
    const proposal = await proposalService.createProposal(projectId, agentId, {
      title,
      description,
      reasoning,
      files
    });

    logger.info(`✅ Proposal created: ${proposal.id} by ${agentId}`);

    res.status(201).json({
      id: proposal.id,
      project_id: proposal.project_id,
      agent_id: proposal.agent_id,
      title: proposal.title,
      status: proposal.status,
      created_at: proposal.created_at,
      message: 'Proposal created successfully',
      viewUrl: `http://localhost:3000/api/proposals/${proposal.id}`
    });
  } catch (error) {
    logger.error('Failed to create proposal:', error);
    next(error);
  }
});

/**
 * GET /api/proposals/:proposalId
 * Get proposal with all reviews
 */
router.get('/proposals/:proposalId', async (req, res, next) => {
  try {
    const { proposalId } = req.params;
    const { proposal: proposalService } = req.services;

    // Get proposal with reviews
    const proposalData = await proposalService.getProposalWithReviews(proposalId);

    res.json({
      id: proposalData.id,
      project_id: proposalData.project_id,
      agent_id: proposalData.agent_id,
      title: proposalData.title,
      description: proposalData.description,
      reasoning: proposalData.reasoning,
      status: proposalData.status,
      files: proposalData.files,
      created_at: proposalData.created_at,
      updated_at: proposalData.updated_at,
      review_count: proposalData.review_count,
      approval_score: proposalData.approval_score,
      reviews: proposalData.reviews.map(r => ({
        id: r.id,
        reviewer_agent_id: r.reviewer_agent_id,
        assessment: r.assessment,
        score: r.score,
        status: r.status,
        suggestions: r.suggestions,
        created_at: r.created_at
      }))
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    logger.error('Failed to get proposal:', error);
    next(error);
  }
});

/**
 * GET /api/proposals
 * List all proposals for a project or globally
 */
router.get('/proposals', async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const { proposal: proposalService } = req.services;

    let proposals;
    if (projectId) {
      proposals = await proposalService.getProjectProposals(projectId);
    } else {
      // Get all proposals (TODO: This should be paginated for production)
      proposals = [];
    }

    res.json({
      total: proposals.length,
      proposals: proposals.map(p => ({
        id: p.id,
        project_id: p.project_id,
        agent_id: p.agent_id,
        title: p.title,
        status: p.status,
        review_count: p.review_count || 0,
        created_at: p.created_at
      }))
    });
  } catch (error) {
    logger.error('Failed to list proposals:', error);
    next(error);
  }
});

export default router;
