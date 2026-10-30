'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin123!', 10);

    await queryInterface.bulkInsert('usuarios', [
      {
        nombre: 'Administrador',
        email: 'admin@bancosycajeros.com',
        password_hash: passwordHash,
        rol: 'administrador',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('usuarios', { email: 'admin@bancosycajeros.com' }, {});
  }
};