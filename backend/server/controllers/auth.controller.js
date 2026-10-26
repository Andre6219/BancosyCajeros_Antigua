const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { Usuario } = require('../../models');


// Seleccionamos los datos que podemos devolver al frontend.
// Nunca incluimos password_hash.
const datosPublicos = (usuario) => ({
  id: usuario.id,
  nombre: usuario.nombre,
  email: usuario.email,
  rol: usuario.rol
});

// Solo un administrador autenticado puede crear registradores.
// verificarToken debe obtener req.usuario desde la base de datos.
exports.registrar = async (req, res) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({
        message: 'Debes iniciar sesión'
      });
    }

    if (
      !req.usuario.activo ||
      req.usuario.rol !== 'administrador'
    ) {
      return res.status(403).json({
        message: 'No tienes permiso para crear usuarios'
      });
    }

    const { nombre, email, password } = req.body || {};

    if (
      typeof nombre !== 'string' ||
      nombre.trim() === '' ||
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== 'string' ||
      password.length < 8
    ) {
      return res.status(400).json({
        message:
          'Envía nombre, un correo válido y una contraseña de al menos 8 caracteres'
      });
    }

    // bcrypt admite hasta 72 bytes de contraseña.
    if (Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({
        message: 'La contraseña es demasiado larga'
      });
    }

    const emailNormalizado = email.trim().toLowerCase();

    const usuarioExiste = await Usuario.findOne({
      where: { email: emailNormalizado }
    });

    if (usuarioExiste) {
      return res.status(409).json({
        message: 'El correo ya está registrado'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const nuevoUsuario = await Usuario.create({
      nombre: nombre.trim(),
      email: emailNormalizado,
      password_hash: passwordHash,
      rol: 'registrador',
      activo: true
    });

    // El rol se asigna en el backend.
    // No aceptamos que el formulario elija "administrador".
    return res.status(201).json({
      message: 'Registrador creado correctamente',
      usuario: datosPublicos(nuevoUsuario)
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        message: 'El correo ya está registrado'
      });
    }

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Los datos del usuario no son válidos'
      });
    }

    console.error('Error al registrar usuario:', error.name);

    return res.status(500).json({
      message: 'Error interno al registrar usuario'
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== 'string' ||
      email.trim() === '' ||
      typeof password !== 'string' ||
      password === ''
    ) {
      return res.status(400).json({
        message: 'Debes enviar email y password'
      });
    }

    const usuario = await Usuario.findOne({
      where: {
        email: email.trim().toLowerCase()
      },
      attributes: [
        'id',
        'nombre',
        'email',
        'password_hash',
        'rol',
        'activo'
      ]
    });

    // Usamos el mismo mensaje para credenciales incorrectas
    // o una cuenta que no puede acceder.
    if (!usuario || !usuario.activo) {
      return res.status(401).json({
        message: 'Credenciales incorrectas o cuenta no disponible'
      });
    }

    const passwordValido = await bcrypt.compare(
      password,
      usuario.password_hash
    );

    if (!passwordValido) {
      return res.status(401).json({
        message: 'Credenciales incorrectas o cuenta no disponible'
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('Falta configurar JWT_SECRET');
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        rol: usuario.rol
      },
      process.env.JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: '8h'
      }
    );

    return res.status(200).json({
      message: 'Inicio de sesión exitoso',
      token,
      usuario: datosPublicos(usuario)
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error.name);

    return res.status(500).json({
      message: 'Error interno al iniciar sesión'
    });
  }
};

// Ruta protegida: devuelve los datos actuales del usuario.
// req.usuario debe venir de verificarToken.
exports.perfil = async (req, res) => {
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

  return res.status(200).json({
    usuario: datosPublicos(req.usuario)
  });
};