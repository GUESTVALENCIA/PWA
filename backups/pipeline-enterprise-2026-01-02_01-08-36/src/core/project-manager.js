/**
 * Project Manager - Gestión de proyectos
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

export class ProjectManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.registryPath = process.env.REGISTRY_PATH || './config/projects-registry.json';
    this.projectsBasePath = process.env.PROJECTS_BASE_PATH || './projects';
  }

  async loadProjects() {
    try {
      if (fs.existsSync(this.registryPath)) {
        const data = JSON.parse(fs.readFileSync(this.registryPath, 'utf-8'));
        data.projects.forEach(project => {
          this.stateManager.registerProject(project);
        });
        logger.info(`✅ Cargados ${data.projects.length} proyectos`);
      } else {
        logger.warn('⚠️ Registro de proyectos no encontrado');
      }
    } catch (error) {
      logger.error('Error cargando proyectos:', error);
    }
  }

  createProject(name, projectPath) {
    const project = {
      id: uuidv4(),
      name,
      path: projectPath,
      status: 'active',
      lock_status: 'unlocked',
      context: {}
    };

    this.stateManager.registerProject(project);
    this.saveRegistry();

    logger.info(`✅ Proyecto creado: ${name}`);
    return project;
  }

  getProject(projectId) {
    return this.stateManager.getProject(projectId);
  }

  getProjectByName(name) {
    for (const [_, project] of this.stateManager.projects) {
      if (project.name === name) return project;
    }
    return null;
  }

  listProjects() {
    return Array.from(this.stateManager.projects.values());
  }

  updateProjectContext(projectId, contextUpdates) {
    const project = this.stateManager.getProject(projectId);
    if (!project) return null;

    return this.stateManager.updateProject(projectId, {
      context: { ...project.context, ...contextUpdates }
    });
  }

  getProjectContext(projectId) {
    const project = this.stateManager.getProject(projectId);
    return project ? project.context : null;
  }

  lockProject(projectId, agentId) {
    this.stateManager.lockProject(projectId, agentId);
    this.stateManager.updateProject(projectId, {
      lock_status: 'locked',
      locked_by_agent: agentId
    });
    this.saveRegistry();
  }

  unlockProject(projectId) {
    this.stateManager.unlockProject(projectId);
    this.stateManager.updateProject(projectId, {
      lock_status: 'unlocked',
      locked_by_agent: null
    });
    this.saveRegistry();
  }

  isProjectLocked(projectId, agentId = null) {
    const isLocked = this.stateManager.isProjectLocked(projectId);
    if (!isLocked) return false;

    const lock = this.stateManager.getProjectLock(projectId);
    if (agentId && lock.agent === agentId) return false; // El mismo agente puede trabajar

    return true;
  }

  getProjectLock(projectId) {
    return this.stateManager.getProjectLock(projectId);
  }

  saveRegistry() {
    try {
      const registry = {
        version: '1.0.0',
        updated_at: new Date().toISOString(),
        projects: this.listProjects()
      };

      const dir = path.dirname(this.registryPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.registryPath, JSON.stringify(registry, null, 2));
    } catch (error) {
      logger.error('Error guardando registro:', error);
    }
  }

  detectProjectFromPath(filePath) {
    const matches = filePath.match(/([^\\\/]+)[\\\/]src/) || filePath.match(/([^\\\/]+)[\\\/]/);
    if (matches) {
      return this.getProjectByName(matches[1]);
    }
    return null;
  }
}
