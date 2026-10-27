'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('lugares', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false
      },
      entidad_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'entidades',
          key: 'id'
        },
        onDelete: 'RESTRICT'
      },
      categoria_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'categorias',
          key: 'id'
        },
        onDelete: 'RESTRICT'
      },
      tipo: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ubicacion_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ubicaciones',
          key: 'id'
        },
        onDelete: 'RESTRICT'
      },
      direccion: {
        type: Sequelize.STRING,
        allowNull: false
      },
      latitud: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: false
      },
      longitud: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: false
      },
      creado_por: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onDelete: 'RESTRICT'
      },
      estado_revision: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pendiente'
      },
      activo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('lugares');
  }
};