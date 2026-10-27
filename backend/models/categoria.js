'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Categoria extends Model {
    static associate(models) {
      Categoria.hasMany(models.Lugar, {
        foreignKey: 'categoria_id',
        as: 'lugares'
      });
    }
  }

  Categoria.init({
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  }, {
    sequelize,
    modelName: 'Categoria',
    tableName: 'categorias',
    timestamps: true
  });

  return Categoria;
};