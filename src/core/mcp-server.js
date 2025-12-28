/**
 * MCP Server - Servidor de protocolo MCP central
 */

import { logger } from '../utils/logger.js';

export class MCPServer {
  constructor(projectManager, stateManager) {
    this.projectManager = projectManager;
    this.stateManager = stateManager;
    this.tools = this.initTools();
  }

  initTools() {
    return {
      project_read: this.toolProjectRead.bind(this),
      project_propose: this.toolProjectPropose.bind(this),
      proposal_review: this.toolProposalReview.bind(this),
      plan_unify: this.toolPlanUnify.bind(this),
      plan_implement: this.toolPlanImplement.bind(this)
    };
  }

  async toolProjectRead({ projectId, filePath }) {
    try {
      const project = this.projectManager.getProject(projectId);
      if (!project) return { error: 'Project not found' };

      return {
        projectId,
        filePath,
        permissions: {
          read: true,
          propose: true,
          implement: false
        }
      };
    } catch (error) {
      logger.error('Tool error:', error);
      return { error: error.message };
    }
  }

  async toolProjectPropose({ projectId, title, files, reasoning }) {
    try {
      const project = this.projectManager.getProject(projectId);
      if (!project) return { error: 'Project not found' };

      const proposal = {
        id: require('uuid').v4(),
        project_id: projectId,
        title,
        files,
        reasoning,
        status: 'pending'
      };

      this.stateManager.registerProposal(proposal);
      return { proposalId: proposal.id, status: 'created' };
    } catch (error) {
      return { error: error.message };
    }
  }

  async toolProposalReview({ proposalId, assessment, suggestions, score }) {
    try {
      const proposal = this.stateManager.getProposal(proposalId);
      if (!proposal) return { error: 'Proposal not found' };

      this.stateManager.addReview(proposalId, {
        assessment,
        suggestions,
        score
      });

      return { status: 'reviewed' };
    } catch (error) {
      return { error: error.message };
    }
  }

  async toolPlanUnify({ proposalIds, strategy }) {
    try {
      const planId = require('uuid').v4();
      const plan = {
        id: planId,
        proposal_ids: proposalIds,
        strategy,
        status: 'pending'
      };

      this.stateManager.registerPlan(plan);
      return { planId, status: 'created' };
    } catch (error) {
      return { error: error.message };
    }
  }

  async toolPlanImplement({ planId, agentId }) {
    try {
      const plan = this.stateManager.getPlan(planId);
      if (!plan) return { error: 'Plan not found' };

      const projectId = plan.project_id;
      this.projectManager.lockProject(projectId, agentId);

      return { status: 'locked', agentId, timeout: '30 minutes' };
    } catch (error) {
      return { error: error.message };
    }
  }

  getToolDefinitions() {
    return [
      {
        name: 'project_read',
        description: 'Lee archivos de un proyecto',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            filePath: { type: 'string' }
          },
          required: ['projectId', 'filePath']
        }
      },
      {
        name: 'project_propose',
        description: 'Crea una propuesta de cambios',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            title: { type: 'string' },
            files: { type: 'array' },
            reasoning: { type: 'string' }
          },
          required: ['projectId', 'title']
        }
      },
      {
        name: 'proposal_review',
        description: 'Revisa una propuesta',
        inputSchema: {
          type: 'object',
          properties: {
            proposalId: { type: 'string' },
            assessment: { type: 'string' },
            suggestions: { type: 'array' },
            score: { type: 'number' }
          },
          required: ['proposalId', 'assessment']
        }
      },
      {
        name: 'plan_unify',
        description: 'Unifica propuestas en plan',
        inputSchema: {
          type: 'object',
          properties: {
            proposalIds: { type: 'array' },
            strategy: { type: 'string' }
          },
          required: ['proposalIds']
        }
      },
      {
        name: 'plan_implement',
        description: 'Implementa plan aprobado',
        inputSchema: {
          type: 'object',
          properties: {
            planId: { type: 'string' },
            agentId: { type: 'string' }
          },
          required: ['planId', 'agentId']
        }
      }
    ];
  }
}
