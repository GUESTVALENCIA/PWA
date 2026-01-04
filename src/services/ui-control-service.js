/**
 * UI Control Service - Gestión de control de interfaz desde voz
 * Comunicación bidireccional con el cliente para acciones de UI
 */

import logger from '../utils/logger.js';

class UIControlService {
  constructor() {
    this.activeNavigations = new Map(); // Map<sessionId, {section, timestamp}>
    this.pendingActions = new Map(); // Map<sessionId, Array<actions>>
    logger.info('[UI CONTROL] ✅ Servicio inicializado');
  }

  /**
   * Enviar comando de scroll al cliente
   * @param {string} target - ID del elemento o sección
   * @param {WebSocket} ws - Conexión WebSocket
   * @param {string} sessionId - ID de sesión
   */
  async scrollTo(target, ws, sessionId) {
    if (!ws || ws.readyState !== 1) {
      logger.warn('[UI CONTROL] ⚠️ WebSocket no disponible para scroll');
      return false;
    }

    try {
      ws.send(JSON.stringify({
        type: 'ui_action',
        action: 'SCROLL',
        target: target,
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      }));

      logger.info(`[UI CONTROL] 📜 Scroll enviado: → ${target}`);
      return true;
    } catch (error) {
      logger.error('[UI CONTROL] Error enviando scroll:', error);
      return false;
    }
  }

  /**
   * Enviar comando de click al cliente
   * @param {string} target - ID del elemento
   * @param {WebSocket} ws - Conexión WebSocket
   * @param {string} sessionId - ID de sesión
   */
  async clickElement(target, ws, sessionId) {
    if (!ws || ws.readyState !== 1) {
      return false;
    }

    try {
      ws.send(JSON.stringify({
        type: 'ui_action',
        action: 'CLICK',
        target: target,
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      }));

      logger.info(`[UI CONTROL] 🖱️ Click enviado: → ${target}`);
      return true;
    } catch (error) {
      logger.error('[UI CONTROL] Error enviando click:', error);
      return false;
    }
  }

  /**
   * Abrir/cerrar modales
   * @param {string} target - ID del modal
   * @param {string} action - 'open' o 'close'
   * @param {WebSocket} ws - Conexión WebSocket
   * @param {string} sessionId - ID de sesión
   */
  async toggleModal(target, action, ws, sessionId) {
    if (!ws || ws.readyState !== 1) {
      return false;
    }

    try {
      ws.send(JSON.stringify({
        type: 'ui_action',
        action: 'TOGGLE_MODAL',
        target: target,
        value: action, // 'open' o 'close'
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      }));

      logger.info(`[UI CONTROL] 🪟 Modal ${action}: ${target}`);
      return true;
    } catch (error) {
      logger.error('[UI CONTROL] Error toggle modal:', error);
      return false;
    }
  }

  /**
   * Navegar a sección específica
   * @param {string} section - Nombre de la sección
   * @param {WebSocket} ws - Conexión WebSocket
   * @param {string} sessionId - ID de sesión
   */
  async navigateToSection(section, ws, sessionId) {
    if (!ws || ws.readyState !== 1) {
      return false;
    }

    try {
      // Registrar navegación activa
      this.activeNavigations.set(sessionId, {
        section: section,
        timestamp: Date.now()
      });

      ws.send(JSON.stringify({
        type: 'ui_navigate',
        section: section,
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      }));

      logger.info(`[UI CONTROL] 🧭 Navegación enviada: → ${section}`);
      return true;
    } catch (error) {
      logger.error('[UI CONTROL] Error navegando:', error);
      return false;
    }
  }

  /**
   * Resaltar elemento
   * @param {string} target - ID del elemento
   * @param {WebSocket} ws - Conexión WebSocket
   * @param {string} sessionId - ID de sesión
   */
  async highlightElement(target, ws, sessionId) {
    if (!ws || ws.readyState !== 1) {
      return false;
    }

    try {
      ws.send(JSON.stringify({
        type: 'ui_action',
        action: 'HIGHLIGHT',
        target: target,
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      }));

      logger.info(`[UI CONTROL] ✨ Highlight enviado: → ${target}`);
      return true;
    } catch (error) {
      logger.error('[UI CONTROL] Error highlight:', error);
      return false;
    }
  }

  /**
   * Obtener sección actual navegada
   * @param {string} sessionId - ID de sesión
   * @returns {string|null} Sección actual o null
   */
  getCurrentSection(sessionId) {
    const nav = this.activeNavigations.get(sessionId);
    return nav ? nav.section : null;
  }

  /**
   * Limpiar navegación activa
   * @param {string} sessionId - ID de sesión
   */
  clearNavigation(sessionId) {
    this.activeNavigations.delete(sessionId);
    this.pendingActions.delete(sessionId);
  }

  /**
   * Mapa de secciones válidas
   */
  static getValidSections() {
    return ['hero', 'properties', 'ai-studio', 'faq', 'dashboard', 'marketing'];
  }

  /**
   * Validar si una sección es válida
   * @param {string} section - Nombre de la sección
   * @returns {boolean}
   */
  static isValidSection(section) {
    return this.getValidSections().includes(section);
  }
}

export default UIControlService;
