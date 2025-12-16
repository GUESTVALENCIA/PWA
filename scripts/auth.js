/**
 * Auth Middleware
 * Autenticación con token global de Sandra
 */

function authMiddleware(req, res, next) {
  const requireAuth = process.env.REQUIRE_AUTH === 'true';
  
  if (!requireAuth) {
    return next();
  }

  const token = req.headers['authorization']?.replace('Bearer ', '') ||
                req.query.token ||
                req.body.token;

  const validToken = process.env.SANDRA_TOKEN || process.env.ADMIN_SECRET_KEY;

  if (!token || token !== validToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token inválido o faltante'
    });
  }

  next();
}

module.exports = authMiddleware;

