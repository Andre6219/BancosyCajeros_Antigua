const express = require('express');
const router = express.Router();

const ubicacionController = require('../controllers/ubicacion.controller');
const verificarToken = require('../middlewares/autenticacion');
const autorizarRoles = require('../middlewares/autorizacion');

// Opciones para los formularios de administrador y registrador.
router.get(
  '/',
  verificarToken,
  autorizarRoles('administrador', 'registrador'),
  ubicacionController.listar
);

module.exports = router;
