const express = require('express');
const router = express.Router();

const lugarController = require('../controllers/lugar.controller');
const verificarToken = require('../middlewares/autenticacion');
const autorizarRoles = require('../middlewares/autorizacion');

router.put(
  '/:id',
  verificarToken,
  autorizarRoles('administrador', 'registrador'),
  lugarController.actualizar
);

module.exports = router;