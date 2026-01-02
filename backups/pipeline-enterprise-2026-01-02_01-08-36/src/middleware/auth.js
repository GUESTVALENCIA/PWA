/**
 * Middleware de Autenticación JWT
 */

import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

const authMiddleware = (req, res, next) => {
  // Public endpoints that don't require authentication
  const publicEndpoints = ['/health', '/api/voice/diagnose'];
  if (publicEndpoints.includes(req.path)) {
    return next();
  }

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
