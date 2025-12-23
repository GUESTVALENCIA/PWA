/**
 * MOCK Subagentes System Setup
 * Created to prevent crash due to missing file.
 */

class SubagentesSystem {
  constructor() {
    this.initialized = false;
  }

  inicializar() {
    console.log(' [Subagentes] Inicializando sistema de subagentes (MOCK MODE)...');
    console.log(' [Subagentes] Los archivos originales no se encontraron, ejecutando en modo seguro.');
    this.initialized = true;
  }

  getStatus() {
    return {
      active: this.initialized,
      mode: 'mock'
    };
  }
}

module.exports = new SubagentesSystem();
