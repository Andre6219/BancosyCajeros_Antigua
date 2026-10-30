'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('entidades', [
      { nombre: 'Banco Industrial', sitio_web: 'https://www.bi.com.gt', createdAt: new Date(), updatedAt: new Date() },
      { nombre: 'Banco G&T Continental', sitio_web: 'https://www.gytcontinental.com.gt', createdAt: new Date(), updatedAt: new Date() },
      { nombre: 'BAM', sitio_web: 'https://www.bam.com.gt', createdAt: new Date(), updatedAt: new Date() }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('entidades', null, {});
  }
};