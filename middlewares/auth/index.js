/**
 * Middleware de autenticación - Verifica si el usuario está logueado
 */
exports.requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/login');
};

/**
 * Middleware para verificar rol específico
 */
exports.requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).send('No autorizado.');
    }
    next();
  };
};

/**
 * Middleware para verificar si el usuario es el creador de un recurso
 */
exports.isOwner = (getModelFn) => {
  return async (req, res, next) => {
    try {
      const resource = await getModelFn(req.params.id);
      if (!resource) {
        return res.status(404).json({ error: 'Recurso no encontrado' });
      }
      
      if (resource.creatorUser && resource.creatorUser.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'No tienes permisos para esta acción.' });
      }
      
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Error en isOwner middleware:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
};
