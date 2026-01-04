/**
 * 🚀 SANDRA ORCHESTRATOR - Conecta IA-SANDRA con PWA
 * 
 * Este orquestador conecta el repositorio IA-SANDRA (https://github.com/GUESTVALENCIA/IA-SANDRA)
 * con el repositorio PWA sin modificar ninguno de los dos.
 * 
 * Funcionalidades:
 * - Carga dinámica de servicios de IA-SANDRA
 * - Integración de pipeline de negociación
 * - Conexión con orquestador de contexto
 * - Unificación de persistencia Neon
 * - Bridge entre ambos sistemas
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import fs from 'fs';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

class SandraOrchestrator {
  constructor(options = {}) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b4f2170f-70ea-47f0-9d5c-aacf6fad5aad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sandra-orchestrator.js:26',message:'Constructor entry',data:{options:Object.keys(options),hasSandraRepoPath:!!options.sandraRepoPath,hasEnvPath:!!process.env.SANDRA_REPO_PATH},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    // Ruta al repo IA-SANDRA (configurable via env o parámetro)
    // Detectar automáticamente la ruta correcta según el entorno
    let defaultPath;
    
    // Detectar si estamos en Render
    const isRender = process.env.RENDER || 
                     process.cwd().includes('/opt/render') || 
                     process.cwd().includes('\\opt\\render') ||
                     fs.existsSync('/opt/render');
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b4f2170f-70ea-47f0-9d5c-aacf6fad5aad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sandra-orchestrator.js:35',message:'Render detection',data:{isRender,processEnvRender:!!process.env.RENDER,cwd:process.cwd(),cwdIncludesOptRender:process.cwd().includes('/opt/render'),fsExistsOptRender:fs.existsSync('/opt/render')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    if (isRender) {
      // En Render, el proyecto está en /opt/render/project/src/ (si rootDir es .)
      // o /opt/render/project/ (si rootDir es src/)
      // El submodule debería estar en /opt/render/project/src/IA-SANDRA
      const possiblePaths = [
        '/opt/render/project/src/IA-SANDRA',
        '/opt/render/project/IA-SANDRA',
        path.join(process.cwd(), 'IA-SANDRA'),
        path.join(process.cwd(), '..', 'IA-SANDRA')
      ];
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4f2170f-70ea-47f0-9d5c-aacf6fad5aad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sandra-orchestrator.js:42',message:'Checking possible paths in Render',data:{possiblePaths,cwd:process.cwd()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      // Buscar la primera ruta que exista
      for (const possiblePath of possiblePaths) {
        const exists = fs.existsSync(possiblePath);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b4f2170f-70ea-47f0-9d5c-aacf6fad5aad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sandra-orchestrator.js:50',message:'Path check result',data:{possiblePath,exists},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        if (exists) {
          defaultPath = possiblePath;
          break;
        }
      }
      
      // Si ninguna existe, usar la más probable
      if (!defaultPath) {
        defaultPath = '/opt/render/project/src/IA-SANDRA';
      }
    } else {
      // En local, usar ruta relativa
      defaultPath = path.join(__dirname, '../../../IA-SANDRA');
    }
    
    this.sandraRepoPath = options.sandraRepoPath || 
      process.env.SANDRA_REPO_PATH || 
      defaultPath;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b4f2170f-70ea-47f0-9d5c-aacf6fad5aad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sandra-orchestrator.js:65',message:'Constructor exit - path set',data:{sandraRepoPath:this.sandraRepoPath,defaultPath,fromOptions:!!options.sandraRepoPath,fromEnv:!!process.env.SANDRA_REPO_PATH},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // Servicios cargados dinámicamente
    this.services = {};
    this.negotiationPipeline = null;
    this.contextOrchestrator = null;
    this.neonAdapter = null;
    this.initialized = false;
    
    logger.info(`[SANDRA ORCHESTRATOR] 🔌 Inicializado - Ruta IA-SANDRA: ${this.sandraRepoPath}`);
  }

  /**
   * Inicializar conexión completa con IA-SANDRA
   * @returns {Promise<boolean>} True si se inicializó correctamente
   */
  async initialize() {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4f2170f-70ea-47f0-9d5c-aacf6fad5aad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sandra-orchestrator.js:83',message:'Initialize entry',data:{sandraRepoPath:this.sandraRepoPath,cwd:process.cwd()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      logger.info('[SANDRA ORCHESTRATOR] 🚀 Iniciando unificación con IA-SANDRA...');
      
      // Verificar que el repo existe - buscar en múltiples ubicaciones posibles
      let foundPath = null;
      
      const initialPathExists = fs.existsSync(this.sandraRepoPath);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4f2170f-70ea-47f0-9d5c-aacf6fad5aad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sandra-orchestrator.js:90',message:'Initial path check',data:{sandraRepoPath:this.sandraRepoPath,exists:initialPathExists},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      if (initialPathExists) {
        foundPath = this.sandraRepoPath;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b4f2170f-70ea-47f0-9d5c-aacf6fad5aad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sandra-orchestrator.js:93',message:'Found at initial path',data:{foundPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      } else {
        // Buscar en ubicaciones alternativas (especialmente en Render)
        const alternativePaths = [
          path.join(process.cwd(), 'IA-SANDRA'),
          path.join(process.cwd(), '..', 'IA-SANDRA'),
          '/opt/render/project/src/IA-SANDRA',
          '/opt/render/project/IA-SANDRA',
          path.join(__dirname, '../../../IA-SANDRA'),
          path.join(__dirname, '../../../../IA-SANDRA')
        ];
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b4f2170f-70ea-47f0-9d5c-aacf6fad5aad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sandra-orchestrator.js:94',message:'Searching alternative paths',data:{alternativePaths,cwd:process.cwd(),__dirname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        for (const altPath of alternativePaths) {
          const altExists = fs.existsSync(altPath);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/b4f2170f-70ea-47f0-9d5c-aacf6fad5aad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sandra-orchestrator.js:103',message:'Alternative path check',data:{altPath,exists:altExists},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          if (altExists) {
            foundPath = altPath;
            this.sandraRepoPath = altPath;
            logger.info(`[SANDRA ORCHESTRATOR] ✅ IA-SANDRA encontrado en ubicación alternativa: ${altPath}`);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b4f2170f-70ea-47f0-9d5c-aacf6fad5aad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sandra-orchestrator.js:108',message:'Found at alternative path',data:{foundPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            break;
          }
        }
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b4f2170f-70ea-47f0-9d5c-aacf6fad5aad',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sandra-orchestrator.js:113',message:'Final path check result',data:{foundPath,searchedPaths:[this.sandraRepoPath,path.join(process.cwd(),'IA-SANDRA'),'/opt/render/project/src/IA-SANDRA']},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      if (!foundPath) {
        logger.warn(`[SANDRA ORCHESTRATOR] ⚠️ IA-SANDRA no encontrado en ninguna ubicación`);
        logger.warn(`[SANDRA ORCHESTRATOR] Buscado en: ${this.sandraRepoPath}`);
        logger.warn(`[SANDRA ORCHESTRATOR] Current working directory: ${process.cwd()}`);
        logger.warn(`[SANDRA ORCHESTRATOR] Continuando con servicios del PWA`);
        return false;
      }
      
      // 1. Cargar servicios de IA de IA-SANDRA
      await this.loadSandraServices();
      
      // 2. Inicializar adaptador Neon de IA-SANDRA (si existe)
      await this.initializeNeonAdapter();
      
      // 3. Inicializar pipeline de negociación
      await this.initializeNegotiationPipeline();
      
      // 4. Inicializar orquestador de contexto
      await this.initializeContextOrchestrator();
      
      this.initialized = true;
      logger.info('[SANDRA ORCHESTRATOR] ✅ Unificación completada exitosamente');
      return true;
    } catch (error) {
      logger.error('[SANDRA ORCHESTRATOR] ❌ Error inicializando:', error);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Cargar servicios de IA desde IA-SANDRA
   * Busca en services/ y carga dinámicamente
   */
  async loadSandraServices() {
    try {
      const servicesPath = path.join(this.sandraRepoPath, 'services');
      
      if (!fs.existsSync(servicesPath)) {
        logger.warn('[SANDRA ORCHESTRATOR] ⚠️ Carpeta services/ no encontrada en IA-SANDRA');
        return;
      }
      
      // Listar archivos en services/
      const serviceFiles = fs.readdirSync(servicesPath)
        .filter(file => file.endsWith('.js') || file.endsWith('.mjs'));
      
      logger.info(`[SANDRA ORCHESTRATOR] 📦 Encontrados ${serviceFiles.length} servicios en IA-SANDRA`);
      
      // Cargar servicios dinámicamente (CommonJS)
      // Nota: La mayoría de servicios de IA-SANDRA usan CommonJS (module.exports)
      for (const file of serviceFiles) {
        try {
          const servicePath = path.join(servicesPath, file);
          const serviceName = path.basename(file, path.extname(file));
          
          // Saltar negotiation-service (ya se carga en initializeNegotiationPipeline)
          if (serviceName === 'negotiation-service') {
            continue;
          }
          
          // Intentar cargar como CommonJS primero
          try {
            const ServiceClass = require(servicePath);
            // Si es una clase, instanciarla (depende del servicio)
            if (typeof ServiceClass === 'function') {
              this.services[serviceName] = ServiceClass;
            } else {
              this.services[serviceName] = ServiceClass;
            }
            logger.info(`[SANDRA ORCHESTRATOR] ✅ Servicio cargado: ${serviceName}`);
          } catch (commonJsError) {
            // Fallback a ES Module si falla CommonJS
            try {
              const module = await import(`file://${servicePath}`);
              this.services[serviceName] = module.default || module;
              logger.info(`[SANDRA ORCHESTRATOR] ✅ Servicio cargado (ES Module): ${serviceName}`);
            } catch (esModuleError) {
              logger.warn(`[SANDRA ORCHESTRATOR] ⚠️ Error cargando servicio ${file}:`, commonJsError.message);
            }
          }
        } catch (error) {
          logger.warn(`[SANDRA ORCHESTRATOR] ⚠️ Error cargando servicio ${file}:`, error.message);
        }
      }
      
      logger.info(`[SANDRA ORCHESTRATOR] ✅ ${Object.keys(this.services).length} servicios cargados`);
    } catch (error) {
      logger.error('[SANDRA ORCHESTRATOR] ❌ Error cargando servicios:', error);
    }
  }

  /**
   * Inicializar adaptador Neon de IA-SANDRA
   * Busca neon-db-adapter/ y lo conecta con el sistema actual
   */
  async initializeNeonAdapter() {
    try {
      const adapterPath = path.join(this.sandraRepoPath, 'neon-db-adapter');
      
      if (!fs.existsSync(adapterPath)) {
        logger.warn('[SANDRA ORCHESTRATOR] ⚠️ neon-db-adapter/ no encontrado en IA-SANDRA');
        logger.info('[SANDRA ORCHESTRATOR] Usando neon-service.js del PWA como fallback');
        return;
      }
      
      // Buscar archivo principal del adaptador
      const adapterFiles = fs.readdirSync(adapterPath)
        .filter(file => file.endsWith('.js') || file.endsWith('.mjs'));
      
      if (adapterFiles.length === 0) {
        logger.warn('[SANDRA ORCHESTRATOR] ⚠️ No se encontraron archivos en neon-db-adapter/');
        return;
      }
      
      // Cargar neon-db.js directamente (CommonJS)
      const neonDbPath = path.join(adapterPath, 'neon-db.js');
      if (!fs.existsSync(neonDbPath)) {
        logger.warn('[SANDRA ORCHESTRATOR] ⚠️ neon-db.js no encontrado en neon-db-adapter/');
        return;
      }
      
      const NeonDB = require(neonDbPath);
      this.neonAdapter = new NeonDB();
      await this.neonAdapter.initializeDatabase();
      
      logger.info('[SANDRA ORCHESTRATOR] ✅ Adaptador Neon de IA-SANDRA cargado');
    } catch (error) {
      logger.warn('[SANDRA ORCHESTRATOR] ⚠️ Error cargando adaptador Neon:', error.message);
      logger.info('[SANDRA ORCHESTRATOR] Continuando con neon-service.js del PWA');
    }
  }

  /**
   * Inicializar pipeline de negociación de IA-SANDRA
   * Carga negotiation-service.js desde services/
   */
  async initializeNegotiationPipeline() {
    try {
      const negotiationServicePath = path.join(this.sandraRepoPath, 'services', 'negotiation-service.js');
      
      if (!fs.existsSync(negotiationServicePath)) {
        logger.warn('[SANDRA ORCHESTRATOR] ⚠️ negotiation-service.js no encontrado en IA-SANDRA/services/');
        logger.info('[SANDRA ORCHESTRATOR] Pipeline de negociación no disponible');
        return;
      }
      
      // Cargar servicio CommonJS usando createRequire
      const NegotiationService = require(negotiationServicePath);
      this.negotiationPipeline = new NegotiationService();
      
      logger.info('[SANDRA ORCHESTRATOR] ✅ Pipeline de negociación cargado (NegotiationService)');
    } catch (error) {
      logger.warn('[SANDRA ORCHESTRATOR] ⚠️ Error cargando pipeline de negociación:', error.message);
    }
  }

  /**
   * Inicializar orquestador de contexto
   * El contexto ya está en el PWA (lib/contextOrchestrator.js), no en IA-SANDRA
   */
  async initializeContextOrchestrator() {
    try {
      // El contexto YA está en el PWA, no en IA-SANDRA
      const contextOrchestratorPath = path.join(__dirname, '../../lib/contextOrchestrator.js');
      
      if (!fs.existsSync(contextOrchestratorPath)) {
        logger.warn('[SANDRA ORCHESTRATOR] ⚠️ contextOrchestrator.js no encontrado en lib/');
        return;
      }
      
      // Cargar contexto del PWA (ES Module)
      const contextModule = await import(`../../lib/contextOrchestrator.js`);
      this.contextOrchestrator = {
        getContext: contextModule.getContext || contextModule.default?.getContext
      };
      
      logger.info('[SANDRA ORCHESTRATOR] ✅ Orquestador de contexto cargado (desde PWA)');
    } catch (error) {
      logger.warn('[SANDRA ORCHESTRATOR] ⚠️ Error cargando orquestador de contexto:', error.message);
    }
  }

  /**
   * Obtener servicio de IA por nombre
   * @param {string} serviceName - Nombre del servicio
   * @returns {Object|null} Servicio o null si no existe
   */
  getService(serviceName) {
    return this.services[serviceName] || null;
  }

  /**
   * Ejecutar negociación de precio
   * @param {Object} params - Parámetros de negociación (propertyId, basePrice, channel, date, guests)
   * @returns {Promise<Object>} Resultado de la negociación
   */
  async negotiatePrice(params) {
    if (!this.negotiationPipeline) {
      logger.warn('[SANDRA ORCHESTRATOR] ⚠️ Pipeline de negociación no disponible');
      return null;
    }
    
    try {
      // NegotiationService usa computeOffer() como método principal
      const result = await this.negotiationPipeline.computeOffer(params);
      logger.info('[SANDRA ORCHESTRATOR] ✅ Negociación ejecutada');
      return result;
    } catch (error) {
      logger.error('[SANDRA ORCHESTRATOR] ❌ Error en negociación:', error);
      return null;
    }
  }

  /**
   * Obtener contexto personalizado para una sesión
   * @param {string} sessionId - ID de sesión
   * @param {Object} userData - Datos del usuario (IP, país, etc.)
   * @returns {Promise<Object>} Contexto personalizado
   */
  async getPersonalizedContext(sessionId, userData) {
    if (!this.contextOrchestrator) {
      logger.warn('[SANDRA ORCHESTRATOR] ⚠️ Orquestador de contexto no disponible');
      return null;
    }
    
    try {
      const context = await this.contextOrchestrator.getContext(
        userData.timezone || 'Europe/Madrid',
        userData.location || 'Valencia'
      );
      
      // Enriquecer con datos del usuario
      context.userData = userData;
      context.sessionId = sessionId;
      
      logger.info('[SANDRA ORCHESTRATOR] ✅ Contexto personalizado generado');
      return context;
    } catch (error) {
      logger.error('[SANDRA ORCHESTRATOR] ❌ Error obteniendo contexto:', error);
      return null;
    }
  }

  /**
   * Verificar estado de inicialización
   * @returns {boolean} True si está inicializado
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Obtener información del estado del orquestador
   * @returns {Object} Estado actual
   */
  getStatus() {
    return {
      initialized: this.initialized,
      sandraRepoPath: this.sandraRepoPath,
      repoExists: fs.existsSync(this.sandraRepoPath),
      servicesLoaded: Object.keys(this.services).length,
      services: Object.keys(this.services),
      hasNegotiationPipeline: !!this.negotiationPipeline,
      hasContextOrchestrator: !!this.contextOrchestrator,
      hasNeonAdapter: !!this.neonAdapter
    };
  }
}

export default SandraOrchestrator;
