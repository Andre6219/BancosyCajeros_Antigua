const { Lugar } = require('../../models');

//Restricciones de acceso: solo administradores y registradores pueden actualizar lugares
exports.actualizar = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'El id del lugar no es válido'
      });
    }

    const lugar = await Lugar.findByPk(id);

    if (!lugar) {
      return res.status(404).json({
        message: 'Lugar no encontrado'
      });
    }

    // req.usuario viene del middleware verificarToken
    const usuario = req.usuario;

    if (usuario.rol === 'registrador') {
      const esPropietario = lugar.creado_por === usuario.id;
      const estaPendiente = lugar.estado_revision === 'pendiente';

      if (!esPropietario || !estaPendiente) {
        return res.status(403).json({
          message: 'Solo puedes editar tus propios lugares pendientes'
        });
      }
    }

    // Aceptamos únicamente los campos editables
    // No permitimos cambiar propietario, aprobación o estado de revisión
    const camposPermitidos = [
      'nombre',
      'entidad_id',
      'tipo',
      'direccion',
      'latitud',
      'longitud'
    ];

    const cambios = {};

    for (const campo of camposPermitidos) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, campo)) {
        cambios[campo] = req.body[campo];
      }
    }

    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({
        message: 'No enviaste campos para actualizar'
      });
    }

    // Conservamos las condiciones en la actualización:
    // si el lugar se aprueba mientras se procesa la petición,
    // el registrador ya no podrá modificarlo.
    const condiciones = { id };

    if (usuario.rol === 'registrador') {
      condiciones.creado_por = usuario.id;
      condiciones.estado_revision = 'pendiente';
    }

    const [cantidadActualizada] = await Lugar.update(cambios, {
      where: condiciones,
      validate: true
    });

    if (cantidadActualizada === 0) {
      return res.status(409).json({
        message:
          'El registro cambió o ya no está disponible para editar. Actualiza la información'
      });
    }

    return res.status(200).json({
      message: 'Lugar actualizado correctamente'
    });
  } catch (error) {
    if (
      error.name === 'SequelizeValidationError' ||
      error.name === 'SequelizeUniqueConstraintError' ||
      error.name === 'SequelizeForeignKeyConstraintError'
    ) {
      return res.status(400).json({
        message:
          'Revisa los datos enviados y que la entidad seleccionada exista'
      });
    }

    console.error('Error al actualizar lugar:', error.name);

    return res.status(500).json({
      message: 'Error interno al actualizar lugar'
    });
  }
};