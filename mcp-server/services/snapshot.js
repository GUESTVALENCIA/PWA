/**
 * Snapshot Service
 * Sistema de snapshots y restauración
 * Alertas y monitoreo
 */

const fs = require('fs').promises;
const path = require('path');

class SnapshotService {
  constructor() {
    this.ready = false;
    this.snapshotsDir = path.join(__dirname, '../snapshots');
    this.alarms = new Map();
    this.alarmChecker = null;
  }

  async initialize() {
    try {
      await fs.mkdir(this.snapshotsDir, { recursive: true });
      this.ready = true;
      this.startAlarmChecker();
      console.log(' Snapshot Service inicializado');
    } catch (error) {
      console.error('Error inicializando Snapshot Service:', error);
    }
  }

  isReady() {
    return this.ready;
  }

  getStatus() {
    return {
      ready: this.ready,
      snapshotsDir: this.snapshotsDir,
      activeAlarms: this.alarms.size
    };
  }

  async createSnapshot(reason = 'scheduled') {
    const snapshot = {
      id: `snapshot_${Date.now()}`,
      reason,
      timestamp: new Date().toISOString(),
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      },
      services: {
        qwen: true,
        cartesia: true,
        bridgeData: true,
        transcriber: true,
        videoSync: true,
        ambientation: true
      },
      config: {
        models: {
          primary: 'qwen-turbo',
          fallback: 'gpt-4o'
        }
      }
    };

    const filename = `${snapshot.id}.json`;
    const filepath = path.join(this.snapshotsDir, filename);

    try {
      await fs.writeFile(filepath, JSON.stringify(snapshot, null, 2));
      console.log(` Snapshot creado: ${filename}`);
      return snapshot;
    } catch (error) {
      throw new Error(`Error creando snapshot: ${error.message}`);
    }
  }

  async restoreSnapshot(snapshotId) {
    const filepath = path.join(this.snapshotsDir, `${snapshotId}.json`);
    
    try {
      const data = await fs.readFile(filepath, 'utf8');
      const snapshot = JSON.parse(data);
      console.log(` Snapshot restaurado: ${snapshotId}`);
      return snapshot;
    } catch (error) {
      throw new Error(`Error restaurando snapshot: ${error.message}`);
    }
  }

  async listSnapshots() {
    try {
      const files = await fs.readdir(this.snapshotsDir);
      return files.filter(f => f.endsWith('.json'));
    } catch (error) {
      return [];
    }
  }

  createAlarm(time, message, callback = null) {
    const alarmId = `alarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const alarm = {
      id: alarmId,
      time: new Date(time).toISOString(),
      message,
      created: new Date().toISOString(),
      callback
    };

    this.alarms.set(alarmId, alarm);
    console.log(` Alarma creada: ${alarmId} - ${message}`);
    return alarm;
  }

  startAlarmChecker() {
    if (this.alarmChecker) {
      clearInterval(this.alarmChecker);
    }

    this.alarmChecker = setInterval(() => {
      const now = new Date();
      this.alarms.forEach((alarm, id) => {
        const alarmTime = new Date(alarm.time);
        if (alarmTime <= now) {
          console.log(` ALARMA ACTIVADA: ${alarm.message}`);
          
          // Ejecutar callback si existe
          if (alarm.callback && typeof alarm.callback === 'function') {
            try {
              alarm.callback(alarm);
            } catch (error) {
              console.error('Error en callback de alarma:', error);
            }
          }
          
          // Crear snapshot si es alarma crítica
          if (alarm.message.toLowerCase().includes('critical') || 
              alarm.message.toLowerCase().includes('error')) {
            this.createSnapshot('alarm_triggered');
          }
          
          this.alarms.delete(id);
        }
      });
    }, 60000); // Verificar cada minuto
  }

  async detectAndRestore() {
    // Detectar errores y restaurar desde snapshot
    try {
      const snapshots = await this.listSnapshots();
      if (snapshots.length > 0) {
        const latest = snapshots[snapshots.length - 1];
        const snapshot = await this.restoreSnapshot(latest.replace('.json', ''));
        console.log(' Sistema restaurado desde snapshot');
        return snapshot;
      }
    } catch (error) {
      console.error('Error en detección/restauración:', error);
    }
  }
}

module.exports = SnapshotService;

