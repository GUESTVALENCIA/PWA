/**
 * Rate Limiting Middleware
 * Per-client request throttling with sliding window
 *
 * Default: 60 requests per minute per client
 * Respects: WebSocket connections via clientId
 */

const { logger } = require('../utils/logger');

class RateLimiter {
  constructor(config = {}) {
    this.requestsPerMinute = config.requestsPerMinute || 60;
    this.windowMs = config.windowMs || 60000; // 60 seconds
    this.clients = new Map(); // Map<clientId, { requests: [], blocked: boolean }>
    this.cleanupInterval = config.cleanupInterval || 30000; // 30 seconds

    // Periodic cleanup of old client records
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  /**
   * Check if client is rate limited
   * Returns { allowed: boolean, remaining: number, resetTime: number }
   */
  checkLimit(clientId) {
    const now = Date.now();

    // Initialize client if not exists
    if (!this.clients.has(clientId)) {
      this.clients.set(clientId, {
        requests: [],
        blocked: false,
        blockedUntil: null
      });
    }

    const client = this.clients.get(clientId);

    // Check if client is temporarily blocked
    if (client.blocked && client.blockedUntil > now) {
      const remainingTime = Math.ceil((client.blockedUntil - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime: remainingTime,
        reason: `Rate limited for ${remainingTime}s`
      };
    } else {
      client.blocked = false;
      client.blockedUntil = null;
    }

    // Remove old requests outside the window
    client.requests = client.requests.filter(
      timestamp => timestamp > now - this.windowMs
    );

    // Check current request count
    const currentRequests = client.requests.length;
    const remaining = Math.max(0, this.requestsPerMinute - currentRequests);

    if (currentRequests >= this.requestsPerMinute) {
      // Block client for 1 minute after hitting limit
      client.blocked = true;
      client.blockedUntil = now + this.windowMs;

      logger.warn(`Rate limit exceeded for client ${clientId}`, {
        requests: currentRequests,
        limit: this.requestsPerMinute
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.ceil(this.windowMs / 1000),
        reason: `Rate limited: ${currentRequests}/${this.requestsPerMinute} requests in window`
      };
    }

    // Record this request
    client.requests.push(now);

    return {
      allowed: true,
      remaining,
      resetTime: Math.ceil(this.windowMs / 1000)
    };
  }

  /**
   * Clean up old client records
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [clientId, client] of this.clients.entries()) {
      // Remove clients with no recent activity (> 1 hour)
      if (client.requests.length === 0 && now - (client.blockedUntil || 0) > 3600000) {
        this.clients.delete(clientId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Rate limiter cleanup: removed ${cleaned} inactive clients`);
    }
  }

  /**
   * Get client stats
   */
  getStats(clientId) {
    if (!this.clients.has(clientId)) {
      return null;
    }

    const client = this.clients.get(clientId);
    const now = Date.now();
    const activeRequests = client.requests.filter(
      timestamp => timestamp > now - this.windowMs
    ).length;

    return {
      clientId,
      activeRequests,
      limit: this.requestsPerMinute,
      blocked: client.blocked,
      blockedUntil: client.blockedUntil
    };
  }

  /**
   * Get all client stats
   */
  getAllStats() {
    const stats = [];
    for (const clientId of this.clients.keys()) {
      const stat = this.getStats(clientId);
      if (stat) {
        stats.push(stat);
      }
    }
    return stats;
  }

  /**
   * Reset client limits
   */
  reset(clientId) {
    if (this.clients.has(clientId)) {
      const client = this.clients.get(clientId);
      client.requests = [];
      client.blocked = false;
      client.blockedUntil = null;
      logger.debug(`Rate limit reset for client ${clientId}`);
    }
  }

  /**
   * Reset all clients
   */
  resetAll() {
    this.clients.clear();
    logger.info('All rate limits reset');
  }
}

const limiter = new RateLimiter();

function checkRateLimit(clientId) {
  return limiter.checkLimit(clientId);
}

module.exports = {
  RateLimiter,
  checkRateLimit,
  limiter
};
