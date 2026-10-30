'use strict';

const { Ubicacion } = require('../../models');

exports.listar = async (req, res) => {
  try {
    const ubicaciones = await Ubicacion.findAll({
      where: {
        municipio: 'Antigua Guatemala',
        departamento: 'Sacatepéquez'
      },
      attributes: ['id', 'municipio', 'departamento'],
      order: [['municipio', 'ASC']]
    });

    return res.status(200).json({
      total: ubicaciones.length,
      ubicaciones
    });
  } catch (error) {
    console.error('Error al listar ubicaciones:', error.name);

    return res.status(500).json({
      message: 'Error interno al consultar las ubicaciones'
    });
  }
};
