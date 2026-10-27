'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('lugares', [
      {
        nombre: 'Agencia Banco Industrial Antigua',
        entidad_id: 1, // Banco Industrial
        categoria_id: 1, // Bancos y cajeros automáticos
        tipo: 'agencia',
        ubicacion_id: 1, // Antigua Guatemala
        direccion: '4a Calle Poniente #25, Antigua Guatemala',
        latitud: 14.5585700,
        longitud: -90.7335700,
        creado_por: 1, // Usuario Administrador
        estado_revision: 'aprobado',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('lugares', null, {});
  }
};