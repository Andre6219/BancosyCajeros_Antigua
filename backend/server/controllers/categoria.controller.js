'use strict';

const { Op } = require('sequelize');
const { Categoria } = require('../../models');

const validarNombre = (nombre) =>
  typeof nombre === 'string' &&
  nombre.trim().length > 0 &&
  nombre.trim().length <= 100;

const errorCategoria = (res, error, accion) => {
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      message: 'Ya existe una categoría con ese nombre'
    });
  }

  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      message: 'El nombre de la categoría no es válido'
    });
  }

  console.error(`Error al ${accion} categoría:`, error.name);
  return res.status(500).json({
    message: 'Error interno al procesar la categoría'
  });
};

exports.listarPublicas = async (req, res) => {
  try {
    const categorias = await Categoria.findAll({
      where: { activo: true },
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']]
    });

    return res.status(200).json({
      total: categorias.length,
      categorias
    });
  } catch (error) {
    return errorCategoria(res, error, 'listar');
  }
};

exports.adminListarTodas = async (req, res) => {
  try {
    const categorias = await Categoria.findAll({
      attributes: ['id', 'nombre', 'activo', 'createdAt', 'updatedAt'],
      order: [['nombre', 'ASC']]
    });

    return res.status(200).json({
      total: categorias.length,
      categorias
    });
  } catch (error) {
    return errorCategoria(res, error, 'listar');
  }
};

exports.crear = async (req, res) => {
  const { nombre } = req.body || {};

  if (!validarNombre(nombre)) {
    return res.status(400).json({
      message: 'nombre debe ser un texto de entre 1 y 100 caracteres'
    });
  }

  try {
    const nombreLimpio = nombre.trim();
    const existente = await Categoria.findOne({
      where: { nombre: { [Op.iLike]: nombreLimpio } }
    });

    if (existente) {
      return res.status(409).json({
        message: 'Ya existe una categoría con ese nombre'
      });
    }

    const categoria = await Categoria.create({
      nombre: nombreLimpio,
      activo: true
    });

    return res.status(201).json({
      message: 'Categoría creada correctamente',
      categoria
    });
  } catch (error) {
    return errorCategoria(res, error, 'crear');
  }
};

exports.actualizar = async (req, res) => {
  const id = Number(req.params.id);
  const { nombre } = req.body || {};

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'El identificador de la categoría no es válido'
    });
  }

  if (!validarNombre(nombre)) {
    return res.status(400).json({
      message: 'nombre debe ser un texto de entre 1 y 100 caracteres'
    });
  }

  try {
    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        message: 'Categoría no encontrada'
      });
    }

    const nombreLimpio = nombre.trim();
    const existente = await Categoria.findOne({
      where: {
        nombre: { [Op.iLike]: nombreLimpio },
        id: { [Op.ne]: id }
      }
    });

    if (existente) {
      return res.status(409).json({
        message: 'Ya existe una categoría con ese nombre'
      });
    }

    await categoria.update({ nombre: nombreLimpio });

    return res.status(200).json({
      message: 'Categoría actualizada correctamente',
      categoria
    });
  } catch (error) {
    return errorCategoria(res, error, 'actualizar');
  }
};

exports.cambiarEstado = async (req, res) => {
  const id = Number(req.params.id);
  const { activo } = req.body || {};

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'El identificador de la categoría no es válido'
    });
  }

  if (typeof activo !== 'boolean') {
    return res.status(400).json({
      message: 'activo debe ser true o false'
    });
  }

  try {
    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        message: 'Categoría no encontrada'
      });
    }

    await categoria.update({ activo });

    return res.status(200).json({
      message: activo
        ? 'Categoría activada correctamente'
        : 'Categoría desactivada correctamente',
      categoria: {
        id: categoria.id,
        nombre: categoria.nombre,
        activo: categoria.activo
      }
    });
  } catch (error) {
    return errorCategoria(res, error, 'cambiar estado de');
  }
};
