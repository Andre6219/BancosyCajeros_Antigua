const jwt = require('jsonwebtoken');
const { Usuario } = require('../../models');


const verificarToken = async (req, res, next) => {
  const authorization = req.headers.authorization;

  // Formato esperado: Authorization: Bearer TOKEN
  const coincidencia =
    typeof authorization === 'string'
      ? authorization.match(/^Bearer\s+(\S+)$/i)
      : null;

  if (!coincidencia) {
    return res.status(401).json({
      message: 'Debes enviar un token de acceso valido'
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error('Falta configurar JWT_SECRET');

    return res.status(500).json({
      message: 'Error de configuración del servidor'
    });
  }

  let datosToken;

  try {
    datosToken = jwt.verify(
      coincidencia[1],
      process.env.JWT_SECRET,
      { algorithms: ['HS256'] }
    );
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Tu sesión venció. Inicia sesión nuevamente'
      });
    }

    return res.status(401).json({
      message: 'Token inválido'
    });
  }

  // Los identificadores del proyecto son enteros positivos
  if (
    !datosToken ||
    typeof datosToken !== 'object' ||
    !Number.isSafeInteger(datosToken.id) ||
    datosToken.id <= 0
  ) {
    return res.status(401).json({
      message: 'Token inválido'
    });
  }

  try {
    const usuario = await Usuario.findByPk(datosToken.id, {
      attributes: ['id', 'nombre', 'email', 'rol', 'activo']
    });

    if (!usuario) {
      return res.status(401).json({
        message: 'La cuenta no está disponible'
      });
    }

    if (!usuario.activo) {
      return res.status(403).json({
        message: 'La cuenta está desactivada'
      });
    }

    // Usamos el rol actual de la base de datos
    // No dependemos del rol que se guardó en el token
    req.usuario = usuario;

    return next();
  } catch (error) {
    console.error('Error al verificar usuario:', error.name);

    return res.status(500).json({
      message: 'Error interno al verificar la sesión'
    });
  }
};

module.exports = verificarToken;