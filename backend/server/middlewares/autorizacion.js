const autorizarRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    // verificarToken debe ejecutarse primero.
    if (!req.usuario) {
      return res.status(401).json({
        message: 'Debes iniciar sesión'
      });
    }

    if (!req.usuario.activo) {
      return res.status(403).json({
        message: 'La cuenta está desactivada'
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        message: 'No tienes permiso para realizar esta acción'
      });
    }

    return next();
  };
};

module.exports = autorizarRoles;