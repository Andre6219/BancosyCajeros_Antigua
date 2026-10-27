'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Lugar extends Model {

    static associate(models) {
  Lugar.belongsTo(models.Entidad, {
    foreignKey: 'entidad_id',
    as: 'entidad',
    onDelete: 'RESTRICT'
  });

  Lugar.belongsTo(models.Categoria, {
    foreignKey: 'categoria_id',
    as: 'categoria',
    onDelete: 'RESTRICT'
  });

  Lugar.belongsTo(models.Ubicacion, {
    foreignKey: 'ubicacion_id',
    as: 'ubicacion',
    onDelete: 'RESTRICT'
  });

  Lugar.belongsTo(models.Usuario, {
    foreignKey: 'creado_por',
    as: 'creador',
    onDelete: 'RESTRICT'
  });
}
  }

  Lugar.init({
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    entidad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'entidades',
        key: 'id'
      }
    },
    categoria_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categorias',
        key: 'id'
      }
    },
    tipo: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['agencia', 'cajero']]
      }
    },
    ubicacion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ubicaciones',
        key: 'id'
      }
    },
    direccion: {
      type: DataTypes.STRING,
      allowNull: false
    },
    latitud: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
      validate: {
        min: -90,
        max: 90
      }
    },
    longitud: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
      validate: {
        min: -180,
        max: 180
      }
    },
    creado_por: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    estado_revision: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pendiente',
      validate: {
        isIn: [['pendiente', 'aprobado']]
      }
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Lugar',
    tableName: 'lugares',
    timestamps: true
  });

  return Lugar;
};