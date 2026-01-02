/**
 * Control de acceso READ/PROPOSE/IMPLEMENT
 */

const accessControl = (req, res, next) => {
  const isReadOnly = req.path.includes('/read') || req.method === 'GET';
  const isPropose = req.path.includes('/propose') || req.method === 'POST';
  const isImplement = req.path.includes('/implement');

  req.access = {
    read: !isImplement,
    propose: !isImplement,
    implement: false // Por defecto bloqueado
  };

  next();
};

export default accessControl;
