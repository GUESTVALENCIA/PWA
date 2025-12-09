/**
 * Event Bus - Sistema de eventos para comunicación entre módulos
 * Permite emitir y escuchar eventos del sistema
 */

class EventBus {
  constructor() {
    this.listeners = new Map();
    this.eventHistory = [];
    this.maxHistory = 100;
  }

  /**
   * Emitir un evento
   * @param {string} eventType - Tipo de evento
   * @param {object} data - Datos del evento
   */
  emit(eventType, data = {}) {
    const event = {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    };

    // Guardar en historial
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.shift();
    }

    // Notificar a los listeners
    const listeners = this.listeners.get(eventType) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error en listener de evento ${eventType}:`, error);
      }
    });

    console.log(`[EVENT_BUS] Evento emitido: ${eventType}`, data);
  }

  /**
   * Escuchar eventos
   * @param {string} eventType - Tipo de evento a escuchar
   * @param {function} callback - Función callback
   * @returns {function} Función para desuscribirse
   */
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);

    // Retornar función de desuscripción
    return () => {
      const listeners = this.listeners.get(eventType);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * Escuchar eventos una sola vez
   */
  once(eventType, callback) {
    const wrapper = (event) => {
      callback(event);
      this.off(eventType, wrapper);
    };
    this.on(eventType, wrapper);
  }

  /**
   * Dejar de escuchar eventos
   */
  off(eventType, callback) {
    const listeners = this.listeners.get(eventType);
    if (!listeners) return;

    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Obtener historial de eventos
   */
  getHistory(eventType = null) {
    if (eventType) {
      return this.eventHistory.filter(e => e.type === eventType);
    }
    return this.eventHistory;
  }

  /**
   * Limpiar historial
   */
  clearHistory() {
    this.eventHistory = [];
  }
}

// Instancia singleton
const eventBus = new EventBus();

module.exports = eventBus;

