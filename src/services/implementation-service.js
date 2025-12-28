/**
 * Implementation Service
 * Manages the implementation phase of approved plans
 */

import logger from '../utils/logger.js';

class ImplementationService {
  constructor(neonService, systemEventEmitter, projectManager) {
    this.neonService = neonService;
    this.eventEmitter = systemEventEmitter;
    this.projectManager = projectManager;
  }

  /**
   * Start implementation of an approved plan
   */
  async startImplementation(planId, projectId, agentId) {
    try {
      // Verify plan exists and is approved
      const plan = await this.neonService.getPlan(planId);
      if (!plan) {
        throw new Error(`Plan ${planId} not found`);
      }

      if (plan.status !== 'approved') {
        throw new Error(`Plan ${planId} is not approved. Current status: ${plan.status}`);
      }

      // Check if agent is assigned (if assignment was required)
      if (plan.assigned_implementer_id && plan.assigned_implementer_id !== agentId) {
        throw new Error(`Plan ${planId} is assigned to ${plan.assigned_implementer_id}, not ${agentId}`);
      }

      // Lock project for this agent
      const lockResult = await this.neonService.lockProject(projectId, agentId, 30);
      if (!lockResult) {
        throw new Error(`Failed to lock project ${projectId}. It may already be locked by another agent.`);
      }

      // Create implementation record
      const implementation = await this.neonService.createImplementation(
        planId,
        projectId,
        agentId
      );

      // Update plan status
      await this.neonService.updatePlanStatus(planId, 'in_progress');

      // Emit event for real-time sync
      this.eventEmitter.emitImplementationStarted(projectId, planId, agentId);

      logger.info(`✅ Implementation started: Plan ${planId} by ${agentId}`);

      return {
        implementation,
        lockInfo: {
          locked_by: agentId,
          locked_at: lockResult.locked_at,
          lock_expires_at: lockResult.lock_expires_at
        }
      };
    } catch (error) {
      logger.error('Failed to start implementation:', error);
      throw error;
    }
  }

  /**
   * Record progress during implementation
   */
  async recordProgress(implementationId, progressData) {
    try {
      const { filesChanged, testResults, status } = progressData;

      // Update implementation record
      const implementation = await this.neonService.recordImplementationChanges(
        implementationId,
        filesChanged,
        testResults
      );

      if (!implementation) {
        throw new Error(`Implementation ${implementationId} not found`);
      }

      logger.info(`Implementation ${implementationId} progress recorded: ${filesChanged?.length || 0} files changed`);

      return implementation;
    } catch (error) {
      logger.error('Failed to record implementation progress:', error);
      throw error;
    }
  }

  /**
   * Complete implementation
   */
  async completeImplementation(implementationId, projectId, completionData = {}) {
    try {
      // Get implementation record
      let implementation = await this.neonService.getImplementation(implementationId);
      if (!implementation) {
        throw new Error(`Implementation ${implementationId} not found`);
      }

      // Update status to completed
      implementation = await this.neonService.updateImplementationStatus(implementationId, 'completed');

      // Unlock project
      await this.neonService.unlockProject(projectId);

      // Get the plan to update its status
      const plan = await this.neonService.getPlan(implementation.plan_id);
      if (plan) {
        await this.neonService.updatePlanStatus(implementation.plan_id, 'completed');
      }

      // Emit completion event
      this.eventEmitter.emitImplementationCompleted(
        projectId,
        implementation.plan_id,
        implementation.agent_id
      );

      logger.info(`✅ Implementation completed: ${implementationId}`);

      return implementation;
    } catch (error) {
      logger.error('Failed to complete implementation:', error);
      throw error;
    }
  }

  /**
   * Handle implementation failure
   */
  async failImplementation(implementationId, projectId, errorDetails) {
    try {
      // Record error
      const implementation = await this.neonService.recordImplementationError(
        implementationId,
        errorDetails
      );

      // Unlock project
      await this.neonService.unlockProject(projectId);

      // Emit failure event
      this.eventEmitter.emitImplementationFailed(
        projectId,
        implementation.plan_id,
        implementation.agent_id
      );

      logger.error(`❌ Implementation failed: ${implementationId}`);
      logger.error(`Error details: ${errorDetails}`);

      return implementation;
    } catch (error) {
      logger.error('Failed to handle implementation failure:', error);
      throw error;
    }
  }

  /**
   * Rollback implementation
   */
  async rollbackImplementation(implementationId, projectId, rollbackData) {
    try {
      // Get implementation record
      const implementation = await this.neonService.getImplementation(implementationId);
      if (!implementation) {
        throw new Error(`Implementation ${implementationId} not found`);
      }

      // Store rollback data
      await this.neonService.sql(
        `UPDATE implementations SET status = 'rolled_back', rollback_data = $1 WHERE id = $2`,
        [JSON.stringify(rollbackData), implementationId]
      );

      // Unlock project
      await this.neonService.unlockProject(projectId);

      // Emit rollback event
      this.eventEmitter.emitImplementationRolledBack(projectId, implementation.plan_id);

      logger.info(`Implementation ${implementationId} rolled back`);

      return { success: true, implementation_id: implementationId };
    } catch (error) {
      logger.error('Failed to rollback implementation:', error);
      throw error;
    }
  }

  /**
   * Get implementation status
   */
  async getImplementationStatus(implementationId) {
    try {
      const implementation = await this.neonService.getImplementation(implementationId);
      if (!implementation) {
        return null;
      }

      const duration = implementation.end_time
        ? new Date(implementation.end_time) - new Date(implementation.start_time)
        : new Date() - new Date(implementation.start_time);

      return {
        id: implementation.id,
        status: implementation.status,
        agent_id: implementation.agent_id,
        started_at: implementation.start_time,
        completed_at: implementation.end_time,
        duration_ms: duration,
        files_changed: JSON.parse(
          typeof implementation.files_changed === 'string'
            ? implementation.files_changed
            : JSON.stringify(implementation.files_changed || [])
        ),
        test_results: JSON.parse(
          typeof implementation.test_results === 'string'
            ? implementation.test_results
            : JSON.stringify(implementation.test_results || {})
        ),
        error_logs: implementation.error_logs
      };
    } catch (error) {
      logger.error('Failed to get implementation status:', error);
      return null;
    }
  }

  /**
   * Get active implementation for project
   */
  async getActiveImplementation(projectId) {
    try {
      return await this.neonService.getActiveImplementation(projectId);
    } catch (error) {
      logger.error('Failed to get active implementation:', error);
      return null;
    }
  }

  /**
   * Get all implementations for a plan
   */
  async getPlanImplementations(planId) {
    try {
      const result = await this.neonService.sql(
        `SELECT * FROM implementations WHERE plan_id = $1 ORDER BY start_time DESC`,
        [planId]
      );
      return result || [];
    } catch (error) {
      logger.error('Failed to get plan implementations:', error);
      return [];
    }
  }

  /**
   * Generate implementation report
   */
  async generateImplementationReport(implementationId) {
    try {
      const status = await this.getImplementationStatus(implementationId);
      if (!status) {
        throw new Error(`Implementation ${implementationId} not found`);
      }

      const testsPassed = status.test_results.passed || 0;
      const testsFailed = status.test_results.failed || 0;
      const totalTests = testsPassed + testsFailed;

      const report = {
        implementation_id: implementationId,
        status: status.status,
        agent: status.agent_id,
        timeline: {
          started_at: status.started_at,
          completed_at: status.completed_at,
          duration_minutes: Math.round(status.duration_ms / 60000)
        },
        files: {
          changed_count: status.files_changed.length,
          files: status.files_changed
        },
        tests: {
          total: totalTests,
          passed: testsPassed,
          failed: testsFailed,
          pass_rate: totalTests > 0 ? ((testsPassed / totalTests) * 100).toFixed(2) + '%' : 'N/A'
        },
        success: status.status === 'completed' && testsFailed === 0
      };

      return report;
    } catch (error) {
      logger.error('Failed to generate implementation report:', error);
      throw error;
    }
  }

  /**
   * Check implementation timeout
   */
  async checkImplementationTimeout(projectId) {
    try {
      const project = await this.neonService.getProject(projectId);
      if (!project) return null;

      if (project.lock_expires_at && new Date(project.lock_expires_at) < new Date()) {
        // Lock has expired
        await this.neonService.unlockProject(projectId);
        logger.warn(`Implementation lock expired for project ${projectId}`);

        return {
          timedOut: true,
          projectId,
          previousLockedBy: project.locked_by
        };
      }

      return {
        timedOut: false,
        projectId,
        lockedBy: project.locked_by,
        expiresAt: project.lock_expires_at
      };
    } catch (error) {
      logger.error('Failed to check implementation timeout:', error);
      return null;
    }
  }

  /**
   * Force unlock project (admin function)
   */
  async forceUnlock(projectId, reason = 'admin_unlock') {
    try {
      const project = await this.neonService.unlockProject(projectId);
      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      logger.warn(`Project ${projectId} force unlocked. Reason: ${reason}`);
      return project;
    } catch (error) {
      logger.error('Failed to force unlock project:', error);
      throw error;
    }
  }

  /**
   * Get implementation history for project
   */
  async getProjectImplementationHistory(projectId, limit = 50) {
    try {
      const result = await this.neonService.sql(
        `SELECT * FROM implementations
         WHERE project_id = $1
         ORDER BY start_time DESC
         LIMIT $2`,
        [projectId, limit]
      );
      return result || [];
    } catch (error) {
      logger.error('Failed to get implementation history:', error);
      return [];
    }
  }

  /**
   * Get implementation metrics for a project
   */
  async getProjectImplementationMetrics(projectId) {
    try {
      const implementations = await this.getProjectImplementationHistory(projectId, 100);

      const metrics = {
        total_implementations: implementations.length,
        successful: 0,
        failed: 0,
        rolled_back: 0,
        avg_duration_minutes: 0,
        success_rate: 0
      };

      let totalDuration = 0;

      for (const impl of implementations) {
        if (impl.status === 'completed') metrics.successful++;
        else if (impl.status === 'failed') metrics.failed++;
        else if (impl.status === 'rolled_back') metrics.rolled_back++;

        if (impl.end_time && impl.start_time) {
          totalDuration += new Date(impl.end_time) - new Date(impl.start_time);
        }
      }

      metrics.avg_duration_minutes = implementations.length > 0
        ? Math.round(totalDuration / implementations.length / 60000)
        : 0;

      metrics.success_rate = implementations.length > 0
        ? ((metrics.successful / implementations.length) * 100).toFixed(2) + '%'
        : 'N/A';

      return metrics;
    } catch (error) {
      logger.error('Failed to get implementation metrics:', error);
      return null;
    }
  }
}

export default ImplementationService;
