'use strict';

const { Entidad } = require('../../models');

exports.listar = async (req, res) => {
  try {
    const entidades = await Entidad.findAll({
      attributes: ['id', 'nombre', 'sitio_web'],
      order: [['nombre', 'ASC']]
    });

    return res.status(200).json({
      total: entidades.length,
      entidades
    });
  } catch (error) {
    console.error('Error al listar entidades:', error.name);

    return res.status(500).json({
      message: 'Error interno al consultar las entidades bancarias'
    });
  }
};
