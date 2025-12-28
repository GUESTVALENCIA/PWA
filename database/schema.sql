-- MCP Orchestrator Database Schema (NEON PostgreSQL)
-- Multi-Agent AI Project Orchestration System

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Projects table: Stores all AI projects under orchestration
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  path TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'suspended')),
  lock_status VARCHAR(50) DEFAULT 'unlocked' CHECK (lock_status IN ('unlocked', 'locked')),
  locked_by VARCHAR(100),
  locked_at TIMESTAMP,
  lock_expires_at TIMESTAMP,
  description TEXT,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_lock ON projects (lock_status);
CREATE INDEX IF NOT EXISTS idx_projects_created ON projects (created_at);

-- Proposals table: Tracks all change proposals from agents
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  agent_id VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected', 'unified', 'implemented')),
  reasoning TEXT,
  files JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  review_count INT DEFAULT 0,
  approval_score DECIMAL(3,1)
);

CREATE INDEX IF NOT EXISTS idx_proposals_project ON proposals (project_id);
CREATE INDEX IF NOT EXISTS idx_proposals_agent ON proposals (agent_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals (status);
CREATE INDEX IF NOT EXISTS idx_proposals_created ON proposals (created_at);

-- Proposal Reviews table: Tracks reviews from other agents
CREATE TABLE IF NOT EXISTS proposal_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  reviewer_agent_id VARCHAR(100) NOT NULL,
  assessment TEXT NOT NULL,
  suggestions JSONB DEFAULT '[]',
  score DECIMAL(3,1) CHECK (score >= 0 AND score <= 10),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suggested_changes')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_proposal ON proposal_reviews (proposal_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON proposal_reviews (reviewer_agent_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON proposal_reviews (created_at);

-- Unified Plans table: Unified proposals ready for implementation
CREATE TABLE IF NOT EXISTS unified_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  proposal_ids UUID[] NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  strategy TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'in_progress', 'completed')),
  approval_agent_id VARCHAR(100),
  approved_at TIMESTAMP,
  assigned_implementer_id VARCHAR(100),
  merged_content JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_plans_project ON unified_plans (project_id);
CREATE INDEX IF NOT EXISTS idx_plans_status ON unified_plans (status);
CREATE INDEX IF NOT EXISTS idx_plans_created ON unified_plans (created_at);

-- Implementations table: Tracks actual implementation progress
CREATE TABLE IF NOT EXISTS implementations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES unified_plans(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  agent_id VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'started' CHECK (status IN ('started', 'in_progress', 'completed', 'failed', 'rolled_back')),
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP,
  files_changed JSONB DEFAULT '[]',
  test_results JSONB DEFAULT '{}',
  error_logs TEXT,
  rollback_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_implementations_plan ON implementations (plan_id);
CREATE INDEX IF NOT EXISTS idx_implementations_project ON implementations (project_id);
CREATE INDEX IF NOT EXISTS idx_implementations_agent ON implementations (agent_id);
CREATE INDEX IF NOT EXISTS idx_implementations_status ON implementations (status);

-- ============================================================================
-- SHARED MEMORY & SYNCHRONIZATION
-- ============================================================================

-- Shared Memory table: Persistent shared context between agents
CREATE TABLE IF NOT EXISTS shared_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  value JSONB,
  visibility VARCHAR(50) DEFAULT 'all' CHECK (visibility IN ('all', 'implementers', 'restricted')),
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, key)
);

CREATE INDEX IF NOT EXISTS idx_memory_project ON shared_memory (project_id);
CREATE INDEX IF NOT EXISTS idx_memory_key ON shared_memory (key);

-- Change Logs table: Complete audit trail of all changes
CREATE TABLE IF NOT EXISTS change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'locked', 'unlocked', 'approved', 'rejected', 'implemented')),
  agent_id VARCHAR(100),
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logs_project ON change_logs (project_id);
CREATE INDEX IF NOT EXISTS idx_logs_entity ON change_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_logs_action ON change_logs (action);
CREATE INDEX IF NOT EXISTS idx_logs_created ON change_logs (created_at);

-- Agent Sessions table: Track active agent connections
CREATE TABLE IF NOT EXISTS agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id VARCHAR(100) NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  connection_type VARCHAR(50) CHECK (connection_type IN ('websocket', 'api', 'both')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'idle', 'disconnected')),
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  disconnected_at TIMESTAMP,
  ip_address VARCHAR(50),
  user_agent TEXT,
  UNIQUE(agent_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_agent ON agent_sessions (agent_id);
CREATE INDEX IF NOT EXISTS idx_sessions_project ON agent_sessions (project_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON agent_sessions (status);

-- ============================================================================
-- PERFORMANCE & INDEXING
-- ============================================================================

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_proposals_project_status
  ON proposals(project_id, status);

CREATE INDEX IF NOT EXISTS idx_reviews_proposal_reviewer
  ON proposal_reviews(proposal_id, reviewer_agent_id);

CREATE INDEX IF NOT EXISTS idx_implementations_plan_status
  ON implementations(plan_id, status);

CREATE INDEX IF NOT EXISTS idx_logs_project_entity_date
  ON change_logs(project_id, entity_type, created_at DESC);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers: Apply update_updated_at to all main tables
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposal_reviews_updated_at BEFORE UPDATE ON proposal_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unified_plans_updated_at BEFORE UPDATE ON unified_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_implementations_updated_at BEFORE UPDATE ON implementations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shared_memory_updated_at BEFORE UPDATE ON shared_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Create change log entry automatically
CREATE OR REPLACE FUNCTION log_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO change_logs (
    project_id,
    entity_type,
    entity_id,
    action,
    old_values,
    new_values
  ) VALUES (
    COALESCE(NEW.project_id, OLD.project_id),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
    END,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers: Log changes to main entities
CREATE TRIGGER log_proposals_changes AFTER INSERT OR UPDATE OR DELETE ON proposals
  FOR EACH ROW EXECUTE FUNCTION log_change();

CREATE TRIGGER log_plans_changes AFTER INSERT OR UPDATE OR DELETE ON unified_plans
  FOR EACH ROW EXECUTE FUNCTION log_change();

CREATE TRIGGER log_implementations_changes AFTER INSERT OR UPDATE OR DELETE ON implementations
  FOR EACH ROW EXECUTE FUNCTION log_change();
