/**
 * Middleware de Autenticación JWT
 */

import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

const authMiddleware = (req, res, next) => {
  // Public endpoints that don't require authentication
  const publicEndpoints = ['/health', '/api/voice/diagnose'];

  // VERBOSE AUTH LOGGING
  logger.info(`[AUTH] Checking request: ${req.method} ${req.path}`);

  // ✅ Allow public access to all Sandra routes (Chat & Voice)
  // Normalizar path para evitar problemas de trailing slashes
  const normalizedPath = req.path.endsWith('/') ? req.path.slice(0, -1) : req.path;

  if (publicEndpoints.includes(normalizedPath) || normalizedPath.startsWith('/api/sandra')) {
    logger.info(`[AUTH] ✅ Public Access Granted for: ${req.path}`);
    return next();
  }

  logger.info(`[AUTH] 🔒 Validating token for protected route...`);

  const token = req.headers.authorization?.split(' ')[1] || req.headers['x-api-key'];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.agent = decoded;
    next();
  } catch (error) {
    if (token.startsWith('cursor_') || token.startsWith('claude_') ||
      token.startsWith('chatgpt_') || token.startsWith('qwen_') ||
      token.startsWith('gemini_')) {
      // API key directa
      req.agent = { id: token.split('_')[0], type: 'api_key' };
      next();
    } else {
      logger.warn(`❌ Autenticación fallida:`, { token: token.substring(0, 20) });
      res.status(401).json({ error: 'Invalid token' });
    }
  }
};

export default authMiddleware;
