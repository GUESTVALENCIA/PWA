/**
 * Error Handler centralizado
 */

import { logger } from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', { message: err.message, stack: err.stack });

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorHandler;
