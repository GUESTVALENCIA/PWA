/**
 * Scheduler Service - Alarmas, snapshots, restauraciones
 * Sistema interno + logs
 */

const fs = require('fs').promises;
const path = require('path');

class SchedulerService {
  constructor() {
    this.ready = true;
    this.alarms = new Map();
    this.snapshotsDir = path.join(__dirname, '../snapshots');
    this.ensureSnapshotsDir();
    this.startAlarmChecker();
  }

  async ensureSnapshotsDir() {
    try {
      await fs.mkdir(this.snapshotsDir, { recursive: true });
    } catch (error) {
      console.error('Error creando directorio de snapshots:', error);
    }
  }

  isReady() {
    return this.ready;
  }

  async createSnapshot() {
    const snapshot = {
      timestamp: new Date().toISOString(),
      services: {
        chat: true,
        voice: true,
        vision: true,
        commands: true
      },
      alarms: Array.from(this.alarms.values()),
      config: {
        models: {
          primary: 'deepseek-chat',
          secondary: 'qwen',
          fallback: 'gpt-4o'
        }
      }
    };

    const filename = `snapshot_${Date.now()}.json`;
    const filepath = path.join(this.snapshotsDir, filename);

    try {
      await fs.writeFile(filepath, JSON.stringify(snapshot, null, 2));
      return {
        success: true,
        filename,
        snapshot
      };
    } catch (error) {
      throw new Error(`Error creando snapshot: ${error.message}`);
    }
  }

  async getActiveAlarms() {
    return Array.from(this.alarms.values()).filter(alarm => {
      return new Date(alarm.time) > new Date();
    });
  }

  async createAlarm(time, message, callback = null) {
    const alarmId = `alarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const alarm = {
      id: alarmId,
      time: new Date(time).toISOString(),
      message,
      created: new Date().toISOString(),
      callback
    };

    this.alarms.set(alarmId, alarm);
    return alarm;
  }

  startAlarmChecker() {
    setInterval(() => {
      const now = new Date();
      this.alarms.forEach((alarm, id) => {
        const alarmTime = new Date(alarm.time);
        if (alarmTime <= now) {
          console.log(`🔔 Alarma activada: ${alarm.message}`);
          if (alarm.callback && typeof alarm.callback === 'function') {
            alarm.callback(alarm);
          }
          this.alarms.delete(id);
        }
      });
    }, 60000); // Verificar cada minuto
  }

  async restoreSnapshot(filename) {
    const filepath = path.join(this.snapshotsDir, filename);
    try {
      const data = await fs.readFile(filepath, 'utf8');
      const snapshot = JSON.parse(data);
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

  async handleWebSocket(action, payload, ws) {
    switch (action) {
      case 'snapshot':
        return await this.createSnapshot();
      case 'alarm':
        return await this.createAlarm(payload.time, payload.message);
      case 'list_alarms':
        return { alarms: await this.getActiveAlarms() };
      case 'list_snapshots':
        return { snapshots: await this.listSnapshots() };
      default:
        return { error: 'Unknown action' };
    }
  }
}

module.exports = SchedulerService;

