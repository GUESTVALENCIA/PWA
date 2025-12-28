/**
 * Logger centralizado para MCP Orchestrator
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, '../../logs');

// Crear directorio de logs si no existe
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || 'info';
    this.logFile = path.join(logsDir, 'mcp-orchestrator.log');
  }

  log(level, message, data = null) {
    if (LOG_LEVELS[level] > LOG_LEVELS[this.level]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(data && { data })
    };

    const logString = JSON.stringify(logEntry);

    // Console output
    const colors = {
      error: '\x1b[31m',
      warn: '\x1b[33m',
      info: '\x1b[36m',
      debug: '\x1b[90m',
      reset: '\x1b[0m'
    };

    console.log(
      `${colors[level]}[${timestamp}] ${level.toUpperCase()}: ${message}${colors.reset}`,
      data ? data : ''
    );

    // File output
    try {
      fs.appendFileSync(this.logFile, logString + '\n');
    } catch (e) {
      console.error('Error escribiendo log:', e);
    }
  }

  error(message, data) { this.log('error', message, data); }
  warn(message, data) { this.log('warn', message, data); }
  info(message, data) { this.log('info', message, data); }
  debug(message, data) { this.log('debug', message, data); }
}

export const logger = new Logger();
