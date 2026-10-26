'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Lugares', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING
      },
      entidad: {
        type: Sequelize.STRING
      },
      tipo: {
        type: Sequelize.STRING
      },
      categoria_id: {
        type: Sequelize.INTEGER
      },
      descripcion: {
        type: Sequelize.TEXT
      },
      departamento: {
        type: Sequelize.STRING
      },
      municipio: {
        type: Sequelize.STRING
      },
      direccion: {
        type: Sequelize.STRING
      },
      latitud: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true
      },
      longitud: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true
      },
      enlace_maps: {
        type: Sequelize.STRING
      },
      telefono: {
        type: Sequelize.STRING
      },
      sitio_web: {
        type: Sequelize.STRING
      },
      creado_por: {
        type: Sequelize.INTEGER
      },
      estado_revision: {
        type: Sequelize.STRING
      },
      activo: {
        type: Sequelize.BOOLEAN
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
    await queryInterface.dropTable('Lugares');
  }
};