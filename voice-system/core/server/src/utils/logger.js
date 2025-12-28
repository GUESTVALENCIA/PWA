/**
 * Centralized Logger Utility
 * Provides structured logging with timestamps and levels
 *
 * Levels: debug, info, warn, error
 * Output: Console (development), stdout (production)
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor(config = {}) {
    this.level = config.level || process.env.LOG_LEVEL || 'info';
    this.format = config.format || 'console'; // 'console' or 'json'
    this.logDir = config.logDir || path.join(__dirname, '../../logs');
    this.maxLogSize = config.maxLogSize || 10 * 1024 * 1024; // 10MB

    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };

    this.colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
      reset: '\x1b[0m'
    };
  }

  /**
   * Format log message
   */
  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(5);

    if (this.format === 'json') {
      return JSON.stringify({
        timestamp,
        level,
        message,
        data,
        pid: process.pid
      });
    }

    const color = this.colors[level] || '';
    const reset = this.colors.reset;
    const dataStr = data ? ` | ${JSON.stringify(data)}` : '';

    return `${timestamp} ${color}[${levelUpper}]${reset} ${message}${dataStr}`;
  }

  /**
   * Write to console
   */
  writeConsole(level, message, data) {
    if (this.levels[level] < this.levels[this.level]) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, data);

    if (level === 'error') {
      console.error(formattedMessage);
    } else if (level === 'warn') {
      console.warn(formattedMessage);
    } else {
      console.log(formattedMessage);
    }
  }

  /**
   * Write to file
   */
  writeFile(level, message, data) {
    const logFile = path.join(this.logDir, `${level}.log`);
    const formattedMessage = this.formatMessage(level, message, data);

    try {
      fs.appendFileSync(logFile, formattedMessage + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  /**
   * Main log method
   */
  log(level, message, data = null) {
    this.writeConsole(level, message, data);

    if (process.env.NODE_ENV === 'production') {
      this.writeFile(level, message, data);
    }
  }

  debug(message, data) {
    this.log('debug', message, data);
  }

  info(message, data) {
    this.log('info', message, data);
  }

  warn(message, data) {
    this.log('warn', message, data);
  }

  error(message, data) {
    this.log('error', message, data);
  }
}

const logger = new Logger();

module.exports = { logger, Logger };
