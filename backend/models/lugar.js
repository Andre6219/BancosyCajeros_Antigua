'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Lugar extends Model {
    static associate(models) {
      // define association here
    }
  }
  Lugar.init({
    nombre: DataTypes.STRING,
    entidad: DataTypes.STRING,
    tipo: DataTypes.STRING,
    categoria_id: DataTypes.INTEGER,
    descripcion: DataTypes.TEXT,
    departamento: DataTypes.STRING,
    municipio: DataTypes.STRING,
    direccion: DataTypes.STRING,
    latitud: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true
    },
    longitud: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true
    },
    enlace_maps: DataTypes.STRING,
    telefono: DataTypes.STRING,
    sitio_web: DataTypes.STRING,
    creado_por: DataTypes.INTEGER,
    estado_revision: DataTypes.STRING,
    activo: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Lugar',
    tableName: 'Lugares',
    timestamps: true
  });
  return Lugar;
};