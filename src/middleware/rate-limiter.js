/**
 * Rate Limiting: 100 requests/min por agente
 */

const requestCounts = new Map();
const WINDOW = 60000; // 1 minuto
const LIMIT = 100;

export const rateLimiter = (req, res, next) => {
  const agentId = req.agent?.id || 'anonymous';
  const now = Date.now();

  if (!requestCounts.has(agentId)) {
    requestCounts.set(agentId, []);
  }

  const requests = requestCounts.get(agentId);

  // Limpiar requests viejos
  const filtered = requests.filter(time => now - time < WINDOW);

  if (filtered.length >= LIMIT) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((filtered[0] + WINDOW - now) / 1000)
    });
  }

  filtered.push(now);
  requestCounts.set(agentId, filtered);

  res.setHeader('X-RateLimit-Limit', LIMIT);
  res.setHeader('X-RateLimit-Remaining', LIMIT - filtered.length);

  next();
};
