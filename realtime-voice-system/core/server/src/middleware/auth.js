/**
 * WebSocket Authentication Middleware
 * Token-based authentication with expiry
 */

const crypto = require('crypto');
const { logger } = require('../utils/logger');

class TokenService {
  constructor() {
    this.tokens = new Map();
    this.tokenTTL = 5 * 60 * 1000; // 5 minutes
  }

  generateToken(clientId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + this.tokenTTL;

    this.tokens.set(token, {
      clientId,
      expiresAt,
      used: false,
      createdAt: Date.now()
    });

    // Auto-cleanup after 6 minutes
    setTimeout(() => {
      this.tokens.delete(token);
    }, 6 * 60 * 1000);

    return { token, expiresIn: 300 };
  }

  validateToken(token) {
    const tokenData = this.tokens.get(token);

    if (!tokenData) {
      return { valid: false, reason: 'Token not found' };
    }

    if (Date.now() > tokenData.expiresAt) {
      this.tokens.delete(token);
      return { valid: false, reason: 'Token expired' };
    }

    if (tokenData.used) {
      return { valid: false, reason: 'Token already used' };
    }

    // Mark as used
    tokenData.used = true;

    return {
      valid: true,
      clientId: tokenData.clientId
    };
  }
}

const tokenService = new TokenService();

function verifyClientUpgrade(info, callback) {
  try {
    const url = new URL(info.req.url, 'ws://localhost');
    const token = url.searchParams.get('token');

    if (!token) {
      callback(false, 401, 'Missing token');
      return;
    }

    const validation = tokenService.validateToken(token);
    if (!validation.valid) {
      callback(false, 401, validation.reason);
      return;
    }

    // Attach to request
    info.req.clientId = validation.clientId;
    callback(true);

  } catch (error) {
    logger.error('Auth error:', error);
    callback(false, 400, 'Invalid request');
  }
}

module.exports = {
  tokenService,
  generateToken: (clientId) => tokenService.generateToken(clientId),
  validateToken: (token) => tokenService.validateToken(token),
  verifyClientUpgrade
};
