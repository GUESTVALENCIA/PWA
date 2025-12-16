/**
 * AgentWatcher
 * Detecta y reporta futuros errores en logs
 * Se activa con triggers de tipo "general", "bottleneck" o "widget"
 */

const eventBus = require('../../utils/event_bus');

class AgentWatcher {
  constructor() {
    this.name = 'AgentWatcher';
    this.description = 'Detecta y reporta futuros errores en logs';
    this.active = false;
    this.watchInterval = null;
  }

  /**
   * Activar el agente
   */
  async activate(trigger, context = {}) {
    this.active = true;
    console.log(`\n[👁️ ${this.name}] Activado por trigger: '${trigger}'`);
    console.log(`[👁️ ${this.name}] Contexto:`, context);

    try {
      // 1. Iniciar monitoreo de logs
      await this.startMonitoring();

      // 2. Analizar logs recientes
      await this.analyzeRecentLogs();

      // 3. Generar reporte
      await this.generateReport(trigger);

      // 4. Emitir alertas si es necesario
      await this.checkAlerts();

      // 5. Emitir eventos de acciones realizadas
      eventBus.emit('agent.action', {
        agent: this.name,
        action: 'monitoring_started',
        trigger,
        timestamp: new Date().toISOString()
      });

      console.log(`[✅ ${this.name}] Monitoreo iniciado\n`);
    } catch (error) {
      console.error(`[❌ ${this.name}] Error:`, error);
      eventBus.emit('agent.error', {
        agent: this.name,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Iniciar monitoreo continuo
   */
  async startMonitoring() {
    console.log(`[👁️ ${this.name}] Iniciando monitoreo continuo...`);
    
    // Monitorear cada 30 segundos
    this.watchInterval = setInterval(() => {
      this.checkLogs();
    }, 30000);

    eventBus.emit('monitor.report', {
      agent: this.name,
      action: 'start_monitoring'
    });
  }

  /**
   * Analizar logs recientes
   */
  async analyzeRecentLogs() {
    console.log(`[📊 ${this.name}] Analizando logs recientes...`);
    eventBus.emit('monitor.report', {
      agent: this.name,
      action: 'analyze_logs'
    });
  }

  /**
   * Generar reporte
   */
  async generateReport(trigger) {
    console.log(`[📄 ${this.name}] Generando reporte...`);
    const report = {
      trigger,
      timestamp: new Date().toISOString(),
      status: 'monitoring',
      agent: this.name
    };

    eventBus.emit('monitor.report', {
      agent: this.name,
      action: 'generate_report',
      report
    });
  }

  /**
   * Verificar alertas
   */
  async checkAlerts() {
    console.log(`[🚨 ${this.name}] Verificando alertas...`);
    eventBus.emit('monitor.alert', {
      agent: this.name,
      action: 'check_alerts'
    });
  }

  /**
   * Verificar logs (llamado periódicamente)
   */
  checkLogs() {
    if (!this.active) return;
    
    eventBus.emit('monitor.report', {
      agent: this.name,
      action: 'periodic_check',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Desactivar monitoreo
   */
  deactivate() {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
    this.active = false;
    console.log(`[⏹️ ${this.name}] Monitoreo detenido`);
  }

  /**
   * Obtener estado del agente
   */
  getStatus() {
    return {
      name: this.name,
      active: this.active,
      description: this.description,
      monitoring: !!this.watchInterval
    };
  }
}

module.exports = AgentWatcher;

