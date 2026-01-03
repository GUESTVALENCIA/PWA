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
        // 🚀 NEON BUFFER: Crear tabla conversation_buffer si no existe
        try {
          await this.sql(`
            CREATE TABLE IF NOT EXISTS conversation_buffer (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              session_id VARCHAR(255) NOT NULL,
              agent_id VARCHAR(100) NOT NULL,
              user_transcript TEXT NOT NULL,
              ai_response TEXT NOT NULL,
              metadata JSONB DEFAULT '{}',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          // Crear índices si no existen
          await this.sql(`
            CREATE INDEX IF NOT EXISTS idx_conversation_session 
            ON conversation_buffer (session_id)
          `);
          await this.sql(`
            CREATE INDEX IF NOT EXISTS idx_conversation_agent 
            ON conversation_buffer (agent_id)
          `);
          await this.sql(`
            CREATE INDEX IF NOT EXISTS idx_conversation_created 
            ON conversation_buffer (created_at DESC)
          `);
          await this.sql(`
            CREATE INDEX IF NOT EXISTS idx_conversation_session_created 
            ON conversation_buffer (session_id, created_at DESC)
          `);
          
          logger.info('✅ Conversation buffer table created/verified');
        } catch (tableError) {
          logger.warn('⚠️ Error creating conversation_buffer table (may already exist):', tableError.message);
        }

        // 🚀 MEMORIA PERSISTENTE: Crear tabla sessions según diseño GPT-4o
        try {
          await this.sql(`
            CREATE TABLE IF NOT EXISTS sessions (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              session_id VARCHAR(255) UNIQUE NOT NULL,
              ip_address VARCHAR(45),
              country VARCHAR(100),
              city VARCHAR(100),
              timezone VARCHAR(100),
              agent_id VARCHAR(100) NOT NULL,
              user_name VARCHAR(255),
              greeting_sent BOOLEAN DEFAULT false,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          await this.sql(`
            CREATE INDEX IF NOT EXISTS idx_sessions_session_id 
            ON sessions (session_id)
          `);
          await this.sql(`
            CREATE INDEX IF NOT EXISTS idx_sessions_ip 
            ON sessions (ip_address)
          `);
          
          logger.info('✅ Sessions table created/verified');
        } catch (tableError) {
          logger.warn('⚠️ Error creating sessions table (may already exist):', tableError.message);
        }

        // 🚀 MEMORIA PERSISTENTE: Crear tabla conversation_history según diseño GPT-4o
        try {
          await this.sql(`
            CREATE TABLE IF NOT EXISTS conversation_history (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              session_id VARCHAR(255) NOT NULL,
              timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              speaker VARCHAR(10) NOT NULL CHECK (speaker IN ('user', 'ai')),
              message TEXT NOT NULL,
              intent VARCHAR(100),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          await this.sql(`
            CREATE INDEX IF NOT EXISTS idx_conversation_history_session 
            ON conversation_history (session_id, timestamp DESC)
          `);
          
          logger.info('✅ Conversation history table created/verified');
        } catch (tableError) {
          logger.warn('⚠️ Error creating conversation_history table (may already exist):', tableError.message);
        }

        // 🚀 MEMORIA PERSISTENTE: Crear tabla users según diseño GPT-4o
        try {
          await this.sql(`
            CREATE TABLE IF NOT EXISTS users (
              user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              name VARCHAR(255),
              language VARCHAR(10) DEFAULT 'es',
              last_session_id VARCHAR(255),
              preferences JSONB DEFAULT '{}',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          await this.sql(`
            CREATE INDEX IF NOT EXISTS idx_users_last_session 
            ON users (last_session_id)
          `);
          
          logger.info('✅ Users table created/verified');
        } catch (tableError) {
          logger.warn('⚠️ Error creating users table (may already exist):', tableError.message);
        }

        // 🚀 MEMORIA PERSISTENTE: Crear tabla negotiation_logs según diseño GPT-4o
        try {
          await this.sql(`
            CREATE TABLE IF NOT EXISTS negotiation_logs (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              session_id VARCHAR(255) NOT NULL,
              property_id VARCHAR(255),
              start_price DECIMAL(10, 2),
              agreed_price DECIMAL(10, 2),
              status VARCHAR(50) DEFAULT 'pending',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          await this.sql(`
            CREATE INDEX IF NOT EXISTS idx_negotiation_session 
            ON negotiation_logs (session_id)
          `);
          
          logger.info('✅ Negotiation logs table created/verified');
        } catch (tableError) {
          logger.warn('⚠️ Error creating negotiation_logs table (may already exist):', tableError.message);
        }

        // 🚀 MEMORIA PERSISTENTE: Mantener call_logs para compatibilidad
        try {
          await this.sql(`
            CREATE TABLE IF NOT EXISTS call_logs (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              call_id VARCHAR(255) UNIQUE NOT NULL,
              session_id VARCHAR(255) NOT NULL,
              agent_id VARCHAR(100) NOT NULL,
              ip_address VARCHAR(45),
              country VARCHAR(100),
              city VARCHAR(100),
              timezone VARCHAR(100),
              language VARCHAR(10) DEFAULT 'es',
              start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              end_time TIMESTAMP,
              user_name VARCHAR(255),
              intent VARCHAR(100),
              conversation_history JSONB DEFAULT '[]',
              booking_details JSONB DEFAULT '{}',
              negotiation_data JSONB DEFAULT '{}',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          await this.sql(`
            CREATE INDEX IF NOT EXISTS idx_call_logs_ip 
            ON call_logs (ip_address)
          `);
          await this.sql(`
            CREATE INDEX IF NOT EXISTS idx_call_logs_session 
            ON call_logs (session_id)
          `);
          await this.sql(`
            CREATE INDEX IF NOT EXISTS idx_call_logs_agent 
            ON call_logs (agent_id)
          `);
          await this.sql(`
            CREATE INDEX IF NOT EXISTS idx_call_logs_start_time 
            ON call_logs (start_time DESC)
          `);
          
          logger.info('✅ Call logs table created/verified');
        } catch (tableError) {
          logger.warn('⚠️ Error creating call_logs table (may already exist):', tableError.message);
        }

        // 🚀 MEMORIA PERSISTENTE: Crear tabla properties para cache de disponibilidad
        try {
          await this.sql(`
            CREATE TABLE IF NOT EXISTS properties (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              property_id VARCHAR(255) UNIQUE NOT NULL,
              name VARCHAR(255),
              location VARCHAR(255),
              availability_data JSONB DEFAULT '{}',
              pricing_data JSONB DEFAULT '{}',
              amenities JSONB DEFAULT '[]',
              last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          await this.sql(`
            CREATE INDEX IF NOT EXISTS idx_properties_property_id 
            ON properties (property_id)
          `);
          await this.sql(`
            CREATE INDEX IF NOT EXISTS idx_properties_location 
            ON properties (location)
          `);
          await this.sql(`
            CREATE INDEX IF NOT EXISTS idx_properties_last_updated 
            ON properties (last_updated DESC)
          `);
          
          logger.info('✅ Properties table created/verified');
        } catch (tableError) {
          logger.warn('⚠️ Error creating properties table (may already exist):', tableError.message);
        }
        
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
  // CONVERSATION BUFFER OPERATIONS
  // ========================================================================

  /**
   * Save conversation exchange to database
   * Stores user transcript and AI response for intelligent context retrieval
   */
  async saveConversationExchange(sessionId, agentId, userTranscript, aiResponse, metadata = {}) {
    try {
      const result = await this.sql(
        `INSERT INTO conversation_buffer (session_id, agent_id, user_transcript, ai_response, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          sessionId,
          agentId,
          userTranscript,
          aiResponse,
          JSON.stringify(metadata || {})
        ]
      );
      logger.debug(`[NEON] ✅ Conversation exchange saved for session ${sessionId}`);
      return result[0];
    } catch (error) {
      logger.error('[NEON] Error saving conversation exchange:', error);
      // Don't throw - allow conversation to continue even if DB fails
      return null;
    }
  }

  /**
   * Get conversation history for a session
   * Returns recent exchanges for context retrieval
   */
  async getConversationHistory(sessionId, limit = 10) {
    try {
      const result = await this.sql(
        `SELECT user_transcript, ai_response, metadata, created_at
         FROM conversation_buffer
         WHERE session_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [sessionId, limit]
      );
      return result.reverse(); // Return in chronological order
    } catch (error) {
      logger.error('[NEON] Error getting conversation history:', error);
      return [];
    }
  }

  /**
   * Get conversation context for AI
   * Returns formatted context from recent exchanges
   * @param {string} sessionId - Session ID
   * @param {number} limit - Number of exchanges to retrieve (default: 5)
   */
  async getConversationContext(sessionId, limit = 5) {
    try {
      const history = await this.getConversationHistory(sessionId, limit);
      if (!history || history.length === 0) return [];
      return history.map(exchange => ({
        user: exchange.user_transcript,
        assistant: exchange.ai_response,
        timestamp: exchange.created_at
      }));
    } catch (error) {
      logger.error('[NEON] Error getting conversation context:', error);
      return [];
    }
  }

  /**
   * Clean old conversations (older than 30 days)
   */
  async cleanOldConversations(days = 30) {
    try {
      const result = await this.sql(
        `DELETE FROM conversation_buffer 
         WHERE created_at < NOW() - INTERVAL '${days} days'`
      );
      logger.info(`[NEON] ✅ Cleaned ${result.length || 0} old conversation exchanges`);
      return result;
    } catch (error) {
      logger.error('[NEON] Error cleaning old conversations:', error);
      return [];
    }
  }

  // ========================================================================
  // CALL LOGS OPERATIONS - Memoria Persistente
  // ========================================================================

  /**
   * Create or update call log entry
   * @param {Object} callData - Call information
   */
  async createOrUpdateCallLog(callData) {
    try {
      const {
        callId,
        sessionId,
        agentId,
        ipAddress,
        country,
        city,
        timezone,
        language = 'es'
      } = callData;

      // Check if call log exists
      const existing = await this.sql(
        `SELECT * FROM call_logs WHERE call_id = $1`,
        [callId]
      );

      if (existing && existing.length > 0) {
        // Update existing
        const result = await this.sql(
          `UPDATE call_logs 
           SET updated_at = CURRENT_TIMESTAMP,
               session_id = COALESCE($2, session_id),
               agent_id = COALESCE($3, agent_id),
               ip_address = COALESCE($4, ip_address),
               country = COALESCE($5, country),
               city = COALESCE($6, city),
               timezone = COALESCE($7, timezone),
               language = COALESCE($8, language)
           WHERE call_id = $1
           RETURNING *`,
          [callId, sessionId, agentId, ipAddress, country, city, timezone, language]
        );
        return result[0];
      } else {
        // Create new
        const result = await this.sql(
          `INSERT INTO call_logs (call_id, session_id, agent_id, ip_address, country, city, timezone, language)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [callId, sessionId, agentId, ipAddress, country, city, timezone, language]
        );
        logger.info(`[NEON] ✅ Call log created for ${callId}`);
        return result[0];
      }
    } catch (error) {
      logger.error('[NEON] Error creating/updating call log:', error);
      return null;
    }
  }

  /**
   * Get call history for an IP address
   * Returns recent calls from the same IP for context
   */
  async getCallHistoryByIP(ipAddress, limit = 5) {
    try {
      const result = await this.sql(
        `SELECT * FROM call_logs 
         WHERE ip_address = $1 
         ORDER BY start_time DESC 
         LIMIT $2`,
        [ipAddress, limit]
      );
      return result;
    } catch (error) {
      logger.error('[NEON] Error getting call history by IP:', error);
      return [];
    }
  }

  /**
   * Update call log with conversation data
   */
  async updateCallLogConversation(callId, conversationData) {
    try {
      const {
        userTranscript,
        aiResponse,
        intent,
        bookingDetails,
        negotiationData
      } = conversationData;

      // Get current conversation history
      const current = await this.sql(
        `SELECT conversation_history FROM call_logs WHERE call_id = $1`,
        [callId]
      );
      
      const history = current[0]?.conversation_history || [];
      history.push({
        user: userTranscript,
        assistant: aiResponse,
        timestamp: new Date().toISOString()
      });

      const result = await this.sql(
        `UPDATE call_logs 
         SET conversation_history = $2,
             intent = COALESCE($3, intent),
             booking_details = COALESCE($4, booking_details),
             negotiation_data = COALESCE($5, negotiation_data),
             updated_at = CURRENT_TIMESTAMP
         WHERE call_id = $1
         RETURNING *`,
        [
          callId,
          JSON.stringify(history),
          intent || null,
          bookingDetails ? JSON.stringify(bookingDetails) : null,
          negotiationData ? JSON.stringify(negotiationData) : null
        ]
      );
      return result[0];
    } catch (error) {
      logger.error('[NEON] Error updating call log conversation:', error);
      return null;
    }
  }

  /**
   * End call - update end_time
   */
  async endCall(callId) {
    try {
      const result = await this.sql(
        `UPDATE call_logs 
         SET end_time = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE call_id = $1
         RETURNING *`,
        [callId]
      );
      return result[0];
    } catch (error) {
      logger.error('[NEON] Error ending call:', error);
      return null;
    }
  }

  // ========================================================================
  // PROPERTIES OPERATIONS - Cache de Disponibilidad
  // ========================================================================

  /**
   * Get property availability from cache
   */
  async getPropertyAvailability(propertyId) {
    try {
      const result = await this.sql(
        `SELECT * FROM properties WHERE property_id = $1`,
        [propertyId]
      );
      return result[0] || null;
    } catch (error) {
      logger.error('[NEON] Error getting property availability:', error);
      return null;
    }
  }

  /**
   * Update property availability cache
   */
  async updatePropertyAvailability(propertyId, availabilityData, pricingData) {
    try {
      const existing = await this.sql(
        `SELECT * FROM properties WHERE property_id = $1`,
        [propertyId]
      );

      if (existing && existing.length > 0) {
        // Update
        const result = await this.sql(
          `UPDATE properties 
           SET availability_data = $2,
               pricing_data = $3,
               last_updated = CURRENT_TIMESTAMP
           WHERE property_id = $1
           RETURNING *`,
          [
            propertyId,
            JSON.stringify(availabilityData),
            JSON.stringify(pricingData)
          ]
        );
        return result[0];
      } else {
        // Create
        const result = await this.sql(
          `INSERT INTO properties (property_id, availability_data, pricing_data)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [
            propertyId,
            JSON.stringify(availabilityData),
            JSON.stringify(pricingData)
          ]
        );
        return result[0];
      }
    } catch (error) {
      logger.error('[NEON] Error updating property availability:', error);
      return null;
    }
  }

  /**
   * Get properties by location
   */
  async getPropertiesByLocation(location, limit = 20) {
    try {
      const result = await this.sql(
        `SELECT * FROM properties 
         WHERE location ILIKE $1 
         ORDER BY last_updated DESC 
         LIMIT $2`,
        [`%${location}%`, limit]
      );
      return result;
    } catch (error) {
      logger.error('[NEON] Error getting properties by location:', error);
      return [];
    }
  }

  // ========================================================================
  // SESSIONS OPERATIONS - Memoria Persistente GPT-4o
  // ========================================================================

  /**
   * Create or update session
   * @param {Object} sessionData - Session information
   */
  async createOrUpdateSession(sessionData) {
    try {
      const {
        sessionId,
        ipAddress,
        country,
        city,
        timezone,
        agentId,
        userName = null,
        greetingSent = false
      } = sessionData;

      // Check if session exists
      const existing = await this.sql(
        `SELECT * FROM sessions WHERE session_id = $1`,
        [sessionId]
      );

      if (existing && existing.length > 0) {
        // Update existing
        const result = await this.sql(
          `UPDATE sessions 
           SET updated_at = CURRENT_TIMESTAMP,
               ip_address = COALESCE($2, ip_address),
               country = COALESCE($3, country),
               city = COALESCE($4, city),
               timezone = COALESCE($5, timezone),
               agent_id = COALESCE($6, agent_id),
               user_name = COALESCE($7, user_name),
               greeting_sent = COALESCE($8, greeting_sent)
           WHERE session_id = $1
           RETURNING *`,
          [sessionId, ipAddress, country, city, timezone, agentId, userName, greetingSent]
        );
        return result[0];
      } else {
        // Create new
        const result = await this.sql(
          `INSERT INTO sessions (session_id, ip_address, country, city, timezone, agent_id, user_name, greeting_sent)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [sessionId, ipAddress, country, city, timezone, agentId, userName, greetingSent]
        );
        logger.info(`[NEON] ✅ Session created: ${sessionId}`);
        return result[0];
      }
    } catch (error) {
      logger.error('[NEON] Error creating/updating session:', error);
      return null;
    }
  }

  /**
   * Get session by sessionId
   * @param {string} sessionId - Session ID
   */
  async getSession(sessionId) {
    try {
      const result = await this.sql(
        `SELECT * FROM sessions WHERE session_id = $1`,
        [sessionId]
      );
      return result[0] || null;
    } catch (error) {
      logger.error('[NEON] Error getting session:', error);
      return null;
    }
  }

  // ========================================================================
  // CONVERSATION HISTORY OPERATIONS - Memoria Persistente GPT-4o
  // ========================================================================

  /**
   * Save conversation history entry
   * @param {string} sessionId - Session ID
   * @param {string} speaker - 'user' or 'ai'
   * @param {string} message - Message content
   * @param {string} intent - Optional intent
   */
  async saveConversationHistoryEntry(sessionId, speaker, message, intent = null) {
    try {
      const result = await this.sql(
        `INSERT INTO conversation_history (session_id, speaker, message, intent)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [sessionId, speaker, message, intent]
      );
      return result[0];
    } catch (error) {
      logger.error('[NEON] Error saving conversation history entry:', error);
      return null;
    }
  }

  /**
   * Get conversation history entries for a session
   * @param {string} sessionId - Session ID
   * @param {number} limit - Number of entries to retrieve
   */
  async getConversationHistoryEntries(sessionId, limit = 10) {
    try {
      const result = await this.sql(
        `SELECT * FROM conversation_history
         WHERE session_id = $1
         ORDER BY timestamp DESC
         LIMIT $2`,
        [sessionId, limit]
      );
      return result.reverse(); // Return in chronological order
    } catch (error) {
      logger.error('[NEON] Error getting conversation history entries:', error);
      return [];
    }
  }

  /**
   * Clean old conversation buffers (non-persistent memory)
   * Removes conversations older than specified days
   */
  async cleanOldConversations(days = 30) {
    try {
      const result = await this.sql(
        `DELETE FROM conversation_buffer
         WHERE created_at < NOW() - INTERVAL '${days} days'
         RETURNING id`
      );
      logger.info(`[NEON] 🧹 Cleaned ${result.length} old conversation exchanges`);
      return result.length;
    } catch (error) {
      logger.error('[NEON] Error cleaning old conversations:', error);
      return 0;
    }
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
