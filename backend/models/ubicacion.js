'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Ubicacion extends Model {
    static associate(models) {
      Ubicacion.hasMany(models.Lugar, {
        foreignKey: 'ubicacion_id',
        as: 'lugares'
      });
    }
  }

  Ubicacion.init({
    municipio: {
      type: DataTypes.STRING,
      allowNull: false
    },
    departamento: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Ubicacion',
    tableName: 'ubicaciones',
    timestamps: true
  });

  return Ubicacion;
};