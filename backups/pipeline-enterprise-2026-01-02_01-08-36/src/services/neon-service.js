/**
 * NEON Database Service
 * Handles all PostgreSQL operations for MCP Orchestrator
 * Connection pooling, query execution, error handling
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import logger from '../utils/logger.js';

neonConfig.fetchConnectionCache = true;

class NeonService {
  constructor(databaseUrl) {
    this.databaseUrl = databaseUrl;
    this.sql = neon(databaseUrl);
    this.initialized = false;
    logger.info('NeonService initialized with NEON serverless');
  }

  /**
   * Initialize database: Create tables if they don't exist
   */
  async initialize() {
    try {
      logger.info('Initializing NEON database schema...');

      // Simple health check - if this works, database is accessible
      const result = await this.sql('SELECT 1 as connected');

      if (result && result.length > 0) {
        this.initialized = true;
        logger.info('✅ Database connection verified');
        return true;
      }
    } catch (error) {
      logger.error('❌ Database initialization failed:', error);
      // Don't throw - allow fallback mode to continue
      return false;
    }
  }

  /**
   * Execute raw query
   */
  async query(queryStr, params = []) {
    try {
      const result = await this.sql(queryStr, params);
      return result;
    } catch (error) {
      logger.error('Database query error:', { query: queryStr, error: error.message });
      throw error;
    }
  }

  // ========================================================================
  // PROJECT OPERATIONS
  // ========================================================================

  async createProject(projectData) {
    const { name, path, description, createdBy } = projectData;
    const result = await this.sql(
      `INSERT INTO projects (name, path, description, created_by, status, lock_status)
       VALUES ($1, $2, $3, $4, 'active', 'unlocked')
       RETURNING *`,
      [name, path, description || null, createdBy || null]
    );
    return result[0];
  }

  async getProject(projectId) {
    const result = await this.sql(
      `SELECT * FROM projects WHERE id = $1`,
      [projectId]
    );
    return result[0] || null;
  }

  async getAllProjects() {
    return await this.sql(`SELECT * FROM projects ORDER BY created_at DESC`);
  }

  async updateProject(projectId, updates) {
    const allowedFields = ['name', 'status', 'description', 'context'];
    const updates_filtered = {};

    for (const field of allowedFields) {
      if (field in updates) {
        updates_filtered[field] = updates[field];
      }
    }

    const sets = Object.keys(updates_filtered).map((k, i) => `${k} = $${i + 1}`);
    const values = Object.values(updates_filtered);

    if (sets.length === 0) return null;

    const result = await this.sql(
      `UPDATE projects SET ${sets.join(', ')} WHERE id = $${sets.length + 1}
       RETURNING *`,
      [...values, projectId]
    );
    return result[0] || null;
  }

  async lockProject(projectId, agentId, timeoutMinutes = 30) {
    const lockExpiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);
    const result = await this.sql(
      `UPDATE projects
       SET lock_status = 'locked', locked_by = $1, locked_at = CURRENT_TIMESTAMP, lock_expires_at = $2
       WHERE id = $3 AND lock_status = 'unlocked'
       RETURNING *`,
      [agentId, lockExpiresAt, projectId]
    );
    return result[0] || null;
  }

  async unlockProject(projectId) {
    const result = await this.sql(
      `UPDATE projects
       SET lock_status = 'unlocked', locked_by = NULL, locked_at = NULL, lock_expires_at = NULL
       WHERE id = $1
       RETURNING *`,
      [projectId]
    );
    return result[0] || null;
  }

  async checkProjectLock(projectId) {
    const result = await this.sql(
      `SELECT lock_status, locked_by, locked_at, lock_expires_at FROM projects WHERE id = $1`,
      [projectId]
    );
    if (!result[0]) return null;

    const lock = result[0];
    // Check if lock has expired
    if (lock.lock_expires_at && new Date(lock.lock_expires_at) < new Date()) {
      await this.unlockProject(projectId);
      return { lock_status: 'unlocked', locked_by: null };
    }
    return lock;
  }

  // ========================================================================
  // PROPOSAL OPERATIONS
  // ========================================================================

  async createProposal(projectId, agentId, proposalData) {
    const { title, description, reasoning, files } = proposalData;
    const result = await this.sql(
      `INSERT INTO proposals (project_id, agent_id, title, description, reasoning, files, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [projectId, agentId, title, description || null, reasoning || null, JSON.stringify(files || [])]
    );
    return result[0];
  }

  async getProposal(proposalId) {
    const result = await this.sql(
      `SELECT * FROM proposals WHERE id = $1`,
      [proposalId]
    );
    return result[0] || null;
  }

  async getProjectProposals(projectId, status = null) {
    if (status) {
      return await this.sql(
        `SELECT * FROM proposals WHERE project_id = $1 AND status = $2 ORDER BY created_at DESC`,
        [projectId, status]
      );
    }
    return await this.sql(
      `SELECT * FROM proposals WHERE project_id = $1 ORDER BY created_at DESC`,
      [projectId]
    );
  }

  async updateProposalStatus(proposalId, status) {
    const result = await this.sql(
      `UPDATE proposals SET status = $1 WHERE id = $2 RETURNING *`,
      [status, proposalId]
    );
    return result[0] || null;
  }

  async updateProposalScore(proposalId, score) {
    const result = await this.sql(
      `UPDATE proposals SET approval_score = $1 WHERE id = $2 RETURNING *`,
      [score, proposalId]
    );
    return result[0] || null;
  }

  // ========================================================================
  // REVIEW OPERATIONS
  // ========================================================================

  async createReview(proposalId, reviewerAgentId, reviewData) {
    const { assessment, suggestions, score, status } = reviewData;
    const result = await this.sql(
      `INSERT INTO proposal_reviews (proposal_id, reviewer_agent_id, assessment, suggestions, score, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [proposalId, reviewerAgentId, assessment, JSON.stringify(suggestions || []), score || null, status || 'pending']
    );

    // Update proposal review count
    await this.sql(
      `UPDATE proposals SET review_count = review_count + 1 WHERE id = $1`,
      [proposalId]
    );

    return result[0];
  }

  async getProposalReviews(proposalId) {
    return await this.sql(
      `SELECT * FROM proposal_reviews WHERE proposal_id = $1 ORDER BY created_at ASC`,
      [proposalId]
    );
  }

  async getReviewsWithScore(proposalId) {
    return await this.sql(
      `SELECT * FROM proposal_reviews WHERE proposal_id = $1 AND score IS NOT NULL ORDER BY created_at ASC`,
      [proposalId]
    );
  }

  // ========================================================================
  // UNIFIED PLAN OPERATIONS
  // ========================================================================

  async createUnifiedPlan(projectId, proposalIds, planData) {
    const { title, description, strategy, createdBy } = planData;
    const result = await this.sql(
      `INSERT INTO unified_plans (project_id, proposal_ids, title, description, strategy, status, created_by)
       VALUES ($1, $2, $3, $4, $5, 'draft', $6)
       RETURNING *`,
      [projectId, proposalIds, title, description || null, strategy || null, createdBy || null]
    );
    return result[0];
  }

  async getPlan(planId) {
    const result = await this.sql(
      `SELECT * FROM unified_plans WHERE id = $1`,
      [planId]
    );
    return result[0] || null;
  }

  async getProjectPlans(projectId, status = null) {
    if (status) {
      return await this.sql(
        `SELECT * FROM unified_plans WHERE project_id = $1 AND status = $2 ORDER BY created_at DESC`,
        [projectId, status]
      );
    }
    return await this.sql(
      `SELECT * FROM unified_plans WHERE project_id = $1 ORDER BY created_at DESC`,
      [projectId]
    );
  }

  async updatePlanStatus(planId, status) {
    const result = await this.sql(
      `UPDATE unified_plans SET status = $1 WHERE id = $2 RETURNING *`,
      [status, planId]
    );
    return result[0] || null;
  }

  async approvePlan(planId, approvalAgentId) {
    const result = await this.sql(
      `UPDATE unified_plans
       SET status = 'approved', approval_agent_id = $1, approved_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [approvalAgentId, planId]
    );
    return result[0] || null;
  }

  async assignImplementer(planId, implementerAgentId) {
    const result = await this.sql(
      `UPDATE unified_plans SET assigned_implementer_id = $1 WHERE id = $2 RETURNING *`,
      [implementerAgentId, planId]
    );
    return result[0] || null;
  }

  // ========================================================================
  // IMPLEMENTATION OPERATIONS
  // ========================================================================

  async createImplementation(planId, projectId, agentId) {
    const result = await this.sql(
      `INSERT INTO implementations (plan_id, project_id, agent_id, status)
       VALUES ($1, $2, $3, 'started')
       RETURNING *`,
      [planId, projectId, agentId]
    );
    return result[0];
  }

  async getImplementation(implementationId) {
    const result = await this.sql(
      `SELECT * FROM implementations WHERE id = $1`,
      [implementationId]
    );
    return result[0] || null;
  }

  async getActiveImplementation(projectId) {
    const result = await this.sql(
      `SELECT * FROM implementations
       WHERE project_id = $1 AND status IN ('started', 'in_progress')
       ORDER BY start_time DESC LIMIT 1`,
      [projectId]
    );
    return result[0] || null;
  }

  async updateImplementationStatus(implementationId, status) {
    const updates = { status };
    if (status === 'completed' || status === 'failed') {
      updates.end_time = new Date();
    }

    const result = await this.sql(
      `UPDATE implementations
       SET status = $1, end_time = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, updates.end_time || null, implementationId]
    );
    return result[0] || null;
  }

  async recordImplementationChanges(implementationId, filesChanged, testResults) {
    const result = await this.sql(
      `UPDATE implementations
       SET files_changed = $1, test_results = $2, status = 'in_progress'
       WHERE id = $3
       RETURNING *`,
      [JSON.stringify(filesChanged || []), JSON.stringify(testResults || {}), implementationId]
    );
    return result[0] || null;
  }

  async recordImplementationError(implementationId, errorLogs) {
    const result = await this.sql(
      `UPDATE implementations
       SET error_logs = $1, status = 'failed'
       WHERE id = $2
       RETURNING *`,
      [errorLogs, implementationId]
    );
    return result[0] || null;
  }

  // ========================================================================
  // SHARED MEMORY OPERATIONS
  // ========================================================================

  async setSharedMemory(projectId, key, value, visibility = 'all', createdBy = null) {
    const result = await this.sql(
      `INSERT INTO shared_memory (project_id, key, value, visibility, created_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (project_id, key)
       DO UPDATE SET value = $3, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [projectId, key, JSON.stringify(value), visibility, createdBy]
    );
    return result[0];
  }

  async getSharedMemory(projectId, key) {
    const result = await this.sql(
      `SELECT value FROM shared_memory WHERE project_id = $1 AND key = $2`,
      [projectId, key]
    );
    return result[0]?.value || null;
  }

  async getAllSharedMemory(projectId) {
    return await this.sql(
      `SELECT key, value, visibility FROM shared_memory WHERE project_id = $1`,
      [projectId]
    );
  }

  // ========================================================================
  // CHANGE LOG OPERATIONS
  // ========================================================================

  async getProjectChangeLogs(projectId, limit = 100) {
    return await this.sql(
      `SELECT * FROM change_logs WHERE project_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [projectId, limit]
    );
  }

  async getEntityChangeLogs(projectId, entityType, entityId, limit = 50) {
    return await this.sql(
      `SELECT * FROM change_logs
       WHERE project_id = $1 AND entity_type = $2 AND entity_id = $3
       ORDER BY created_at DESC LIMIT $4`,
      [projectId, entityType, entityId, limit]
    );
  }

  // ========================================================================
  // AGENT SESSION OPERATIONS
  // ========================================================================

  async createAgentSession(agentId, projectId, connectionType, ipAddress, userAgent) {
    const result = await this.sql(
      `INSERT INTO agent_sessions (agent_id, project_id, connection_type, status, ip_address, user_agent)
       VALUES ($1, $2, $3, 'active', $4, $5)
       RETURNING *`,
      [agentId, projectId, connectionType, ipAddress || null, userAgent || null]
    );
    return result[0];
  }

  async updateAgentSessionActivity(sessionId) {
    const result = await this.sql(
      `UPDATE agent_sessions SET last_activity = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [sessionId]
    );
    return result[0] || null;
  }

  async closeAgentSession(sessionId) {
    const result = await this.sql(
      `UPDATE agent_sessions SET status = 'disconnected', disconnected_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [sessionId]
    );
    return result[0] || null;
  }

  async getActiveAgentSessions(projectId) {
    return await this.sql(
      `SELECT * FROM agent_sessions WHERE project_id = $1 AND status = 'active' ORDER BY connected_at DESC`,
      [projectId]
    );
  }

  // ========================================================================
  // BATCH OPERATIONS
  // ========================================================================

  async markProposalsAsUnified(proposalIds) {
    if (!proposalIds || proposalIds.length === 0) return [];

    return await this.sql(
      `UPDATE proposals SET status = 'unified' WHERE id = ANY($1) RETURNING id`,
      [proposalIds]
    );
  }

  // ========================================================================
  // HEALTH CHECK
  // ========================================================================

  async healthCheck() {
    try {
      const result = await this.sql(`SELECT 1 as healthy`);
      return result.length > 0;
    } catch (error) {
      logger.error('Health check failed:', error);
      return false;
    }
  }
}

export default NeonService;
