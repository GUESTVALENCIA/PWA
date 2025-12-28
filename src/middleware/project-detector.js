/**
 * Middleware para detectar proyecto actual
 */

export const projectDetector = (req, res, next) => {
  // Detectar proyecto desde URL params
  let projectId = req.params.projectId;

  // O desde query
  if (!projectId) {
    projectId = req.query.projectId;
  }

  // O desde body
  if (!projectId && req.body) {
    projectId = req.body.projectId;
  }

  // O desde header
  if (!projectId) {
    projectId = req.headers['x-project-id'];
  }

  req.projectId = projectId;
  next();
};
