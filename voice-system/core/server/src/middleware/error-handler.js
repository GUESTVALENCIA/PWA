/**
 * Error Handler Middleware
 * Unified error handling and recovery strategies
 *
 * Categories:
 * - Authentication errors (401)
 * - Validation errors (400)
 * - Rate limit errors (429)
 * - Service errors (503)
 * - Server errors (500)
 */

const { logger } = require('../utils/logger');

class ErrorHandler {
  /**
   * Categorize and handle errors
   */
  static handle(error, context = {}) {
    const errorResponse = {
      error: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
      context: context.operation || null
    };

    // Log error
    logger.error(`Error in ${context.operation || 'operation'}:`, {
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n')[0] // First line of stack
    });

    return errorResponse;
  }

  /**
   * Get HTTP status code for error
   */
  static getStatusCode(error) {
    if (error.code === 'RATE_LIMITED') return 429;
    if (error.code === 'UNAUTHORIZED') return 401;
    if (error.code === 'INVALID_INPUT') return 400;
    if (error.code === 'SERVICE_UNAVAILABLE') return 503;
    if (error.code === 'NOT_FOUND') return 404;
    return 500;
  }

  /**
   * Handle WebSocket errors
   */
  static handleWebSocketError(error, ws, clientId) {
    const errorResponse = {
      type: 'error',
      clientId,
      message: error.message,
      code: error.code || 'WEBSOCKET_ERROR',
      timestamp: Date.now()
    };

    logger.error(`WebSocket error for client ${clientId}:`, {
      message: error.message,
      code: error.code
    });

    try {
      if (ws && ws.readyState === 1) { // OPEN
        ws.send(JSON.stringify(errorResponse));
      }
    } catch (sendError) {
      logger.error(`Failed to send error to client ${clientId}:`, sendError.message);
    }

    return errorResponse;
  }

  /**
   * Create error with code
   */
  static create(message, code = 'UNKNOWN_ERROR') {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  /**
   * Check if error is recoverable
   */
  static isRecoverable(error) {
    const recoverableCodes = [
      'RATE_LIMITED',
      'TEMPORARY_UNAVAILABLE',
      'TIMEOUT',
      'CONNECTION_RESET'
    ];

    return recoverableCodes.includes(error.code);
  }

  /**
   * Get recovery strategy
   */
  static getRecoveryStrategy(error) {
    switch (error.code) {
      case 'RATE_LIMITED':
        return {
          action: 'wait',
          delay: 60000, // Wait 1 minute
          retry: true
        };

      case 'TEMPORARY_UNAVAILABLE':
        return {
          action: 'retry',
          delay: 5000, // Retry after 5 seconds
          maxRetries: 3,
          backoff: true
        };

      case 'TIMEOUT':
        return {
          action: 'retry',
          delay: 1000,
          maxRetries: 2
        };

      case 'CONNECTION_RESET':
        return {
          action: 'reconnect',
          delay: 2000,
          maxRetries: 5,
          backoff: true
        };

      default:
        return {
          action: 'fail',
          retry: false
        };
    }
  }

  /**
   * Format error for client response
   */
  static formatForClient(error) {
    const userFriendlyMessages = {
      'RATE_LIMITED': 'Too many requests. Please wait a moment.',
      'UNAUTHORIZED': 'Authentication failed. Please provide a valid token.',
      'INVALID_INPUT': 'Invalid request format.',
      'SERVICE_UNAVAILABLE': 'Service temporarily unavailable. Please try again.',
      'UNKNOWN_ERROR': 'An error occurred. Please try again.'
    };

    return {
      error: userFriendlyMessages[error.code] || error.message,
      code: error.code,
      timestamp: Date.now()
    };
  }
}

module.exports = ErrorHandler;
