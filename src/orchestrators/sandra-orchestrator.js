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
import fs from 'fs';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SandraOrchestrator {
  constructor(options = {}) {
    // Ruta al repo IA-SANDRA (configurable via env o parámetro)
    this.sandraRepoPath = options.sandraRepoPath || 
      process.env.SANDRA_REPO_PATH || 
      path.join(__dirname, '../../../IA-SANDRA');
    
    // Verificar que el repo existe
    if (!fs.existsSync(this.sandraRepoPath)) {
      logger.warn(`[SANDRA ORCHESTRATOR] ⚠️ Repo IA-SANDRA no encontrado en: ${this.sandraRepoPath}`);
      logger.warn(`[SANDRA ORCHESTRATOR] Configura SANDRA_REPO_PATH en .env o clona el repo`);
    }
    
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
      logger.info('[SANDRA ORCHESTRATOR] 🚀 Iniciando unificación con IA-SANDRA...');
      
      // Verificar que el repo existe
      if (!fs.existsSync(this.sandraRepoPath)) {
        logger.error(`[SANDRA ORCHESTRATOR] ❌ Repo IA-SANDRA no encontrado: ${this.sandraRepoPath}`);
        logger.error('[SANDRA ORCHESTRATOR] Por favor, clona el repo o configura SANDRA_REPO_PATH');
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
      
      // Cargar servicios dinámicamente
      for (const file of serviceFiles) {
        try {
          const servicePath = path.join(servicesPath, file);
          const serviceName = path.basename(file, path.extname(file));
          
          // Intentar cargar el módulo
          const module = await import(`file://${servicePath}`);
          this.services[serviceName] = module.default || module;
          
          logger.info(`[SANDRA ORCHESTRATOR] ✅ Servicio cargado: ${serviceName}`);
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
      
      // Cargar el adaptador principal (normalmente index.js o main.js)
      const mainAdapter = adapterFiles.find(f => 
        f === 'index.js' || f === 'main.js' || f === 'adapter.js'
      ) || adapterFiles[0];
      
      const adapterModule = await import(`file://${path.join(adapterPath, mainAdapter)}`);
      this.neonAdapter = adapterModule.default || adapterModule;
      
      logger.info('[SANDRA ORCHESTRATOR] ✅ Adaptador Neon de IA-SANDRA cargado');
    } catch (error) {
      logger.warn('[SANDRA ORCHESTRATOR] ⚠️ Error cargando adaptador Neon:', error.message);
      logger.info('[SANDRA ORCHESTRATOR] Continuando con neon-service.js del PWA');
    }
  }

  /**
   * Inicializar pipeline de negociación de IA-SANDRA
   * Busca negotiation/ y carga el pipeline completo
   */
  async initializeNegotiationPipeline() {
    try {
      const negotiationPath = path.join(this.sandraRepoPath, 'negotiation');
      
      if (!fs.existsSync(negotiationPath)) {
        logger.warn('[SANDRA ORCHESTRATOR] ⚠️ Carpeta negotiation/ no encontrada en IA-SANDRA');
        logger.info('[SANDRA ORCHESTRATOR] Pipeline de negociación no disponible');
        return;
      }
      
      // Buscar archivo principal del pipeline
      const pipelineFiles = fs.readdirSync(negotiationPath)
        .filter(file => file.endsWith('.js') || file.endsWith('.mjs'));
      
      const mainPipeline = pipelineFiles.find(f => 
        f === 'index.js' || f === 'pipeline.js' || f === 'negotiation.js'
      ) || pipelineFiles[0];
      
      if (!mainPipeline) {
        logger.warn('[SANDRA ORCHESTRATOR] ⚠️ No se encontró archivo principal del pipeline');
        return;
      }
      
      const pipelineModule = await import(`file://${path.join(negotiationPath, mainPipeline)}`);
      this.negotiationPipeline = pipelineModule.default || pipelineModule;
      
      logger.info('[SANDRA ORCHESTRATOR] ✅ Pipeline de negociación cargado');
    } catch (error) {
      logger.warn('[SANDRA ORCHESTRATOR] ⚠️ Error cargando pipeline de negociación:', error.message);
    }
  }

  /**
   * Inicializar orquestador de contexto de IA-SANDRA
   * Busca context/ y carga el orquestador
   */
  async initializeContextOrchestrator() {
    try {
      const contextPath = path.join(this.sandraRepoPath, 'context');
      
      if (!fs.existsSync(contextPath)) {
        logger.warn('[SANDRA ORCHESTRATOR] ⚠️ Carpeta context/ no encontrada en IA-SANDRA');
        logger.info('[SANDRA ORCHESTRATOR] Usando contextOrchestrator.js del PWA como fallback');
        return;
      }
      
      // Buscar archivo principal del orquestador
      const contextFiles = fs.readdirSync(contextPath)
        .filter(file => file.endsWith('.js') || file.endsWith('.mjs'));
      
      const mainContext = contextFiles.find(f => 
        f === 'index.js' || f === 'orchestrator.js' || f === 'context.js'
      ) || contextFiles[0];
      
      if (!mainContext) {
        logger.warn('[SANDRA ORCHESTRATOR] ⚠️ No se encontró archivo principal del orquestador');
        return;
      }
      
      const contextModule = await import(`file://${path.join(contextPath, mainContext)}`);
      this.contextOrchestrator = contextModule.default || contextModule;
      
      logger.info('[SANDRA ORCHESTRATOR] ✅ Orquestador de contexto cargado');
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
   * @param {Object} params - Parámetros de negociación
   * @returns {Promise<Object>} Resultado de la negociación
   */
  async negotiatePrice(params) {
    if (!this.negotiationPipeline) {
      logger.warn('[SANDRA ORCHESTRATOR] ⚠️ Pipeline de negociación no disponible');
      return null;
    }
    
    try {
      const result = await this.negotiationPipeline.calculateOffer(params);
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
