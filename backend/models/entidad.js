'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Entidad extends Model {
    static associate(models) {
      Entidad.hasMany(models.Lugar, {
        foreignKey: 'entidad_id',
        as: 'lugares'
      });
    }
  }

  Entidad.init({
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    sitio_web: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Entidad',
    tableName: 'entidades',
    timestamps: true
  });

  return Entidad;
};