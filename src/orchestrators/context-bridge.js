/**
 * 🔄 CONTEXT BRIDGE - Conecta Orquestador de Contexto de IA-SANDRA
 * 
 * Bridge que conecta el orquestador de contexto de IA-SANDRA con el sistema PWA
 * para personalización basada en IP, clima, hora, eventos, etc.
 */

import logger from '../utils/logger.js';

class ContextBridge {
  constructor(sandraOrchestrator) {
    this.sandraOrchestrator = sandraOrchestrator;
    this.contextOrchestrator = null;
  }

  /**
   * Inicializar bridge con orquestador de contexto de IA-SANDRA
   */
  async initialize() {
    if (this.sandraOrchestrator && this.sandraOrchestrator.contextOrchestrator) {
      this.contextOrchestrator = this.sandraOrchestrator.contextOrchestrator;
      logger.info('[CONTEXT BRIDGE] ✅ Orquestador de contexto conectado');
      return true;
    }
    
    logger.warn('[CONTEXT BRIDGE] ⚠️ Orquestador de contexto no disponible');
    logger.info('[CONTEXT BRIDGE] Usando contextOrchestrator.js del PWA como fallback');
    return false;
  }

  /**
   * Obtener contexto completo para una llamada
   * @param {Object} userData - Datos del usuario
   * @param {string} userData.ipAddress - IP del usuario
   * @param {string} userData.country - País
   * @param {string} userData.city - Ciudad
   * @param {string} userData.timezone - Zona horaria
   * @returns {Promise<Object>} Contexto completo
   */
  async getContext(userData) {
    const timezone = userData.timezone || 'Europe/Madrid';
    const location = userData.city || 'Valencia';
    
    try {
      if (this.contextOrchestrator && typeof this.contextOrchestrator.getContext === 'function') {
        // Usar orquestador de IA-SANDRA
        const context = await this.contextOrchestrator.getContext(timezone, location);
        
        // Enriquecer con datos del usuario
        context.userData = userData;
        context.personalized = true;
        
        logger.info('[CONTEXT BRIDGE] ✅ Contexto obtenido de IA-SANDRA');
        return context;
      } else {
        // Fallback al orquestador del PWA
        const { getContext } = await import('../../lib/contextOrchestrator.js');
        const context = await getContext(timezone, location);
        
        context.userData = userData;
        context.personalized = true;
        context.source = 'pwa-fallback';
        
        logger.info('[CONTEXT BRIDGE] ✅ Contexto obtenido del PWA (fallback)');
        return context;
      }
    } catch (error) {
      logger.error('[CONTEXT BRIDGE] ❌ Error obteniendo contexto:', error);
      
      // Retornar contexto mínimo
      return {
        userData,
        scene: {
          id: 'default',
          look: 'professional',
          voice: 'calm',
          video: 'sandra_default.mp4'
        },
        personalized: false,
        source: 'fallback'
      };
    }
  }

  /**
   * Obtener escena personalizada según contexto
   * @param {Object} context - Contexto completo
   * @returns {Object} Configuración de escena
   */
  getSceneConfig(context) {
    if (!context || !context.scene) {
      return {
        look: 'professional',
        voice: 'calm',
        video: 'sandra_default.mp4'
      };
    }

    return {
      look: context.scene.look || 'professional',
      voice: context.scene.voice || 'calm',
      video: context.scene.video || 'sandra_default.mp4',
      language: context.scene.language || 'es',
      priceMultiplier: context.scene.priceMultiplier || 1.0
    };
  }
}

export default ContextBridge;
