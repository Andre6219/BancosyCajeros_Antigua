const express = require('express');
const router = express.Router();

const entidadController = require('../controllers/entidad.controller');
const verificarToken = require('../middlewares/autenticacion');
const autorizarRoles = require('../middlewares/autorizacion');

// Opciones para los formularios de administrador y registrador.
router.get(
  '/',
  verificarToken,
  autorizarRoles('administrador', 'registrador'),
  entidadController.listar
);

module.exports = router;
