'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('ubicaciones', [
      {
        municipio: 'Antigua Guatemala',
        departamento: 'Sacatepéquez',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ubicaciones', null, {});
  }
};