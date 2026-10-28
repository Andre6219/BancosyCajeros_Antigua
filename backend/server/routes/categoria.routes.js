const express = require('express');
const router = express.Router();

const categoriaController = require('../controllers/categoria.controller');
const verificarToken = require('../middlewares/autenticacion');
const autorizarRoles = require('../middlewares/autorizacion');

router.get(
  '/admin/todas',
  verificarToken,
  autorizarRoles('administrador'),
  categoriaController.adminListarTodas
);

router.post(
  '/',
  verificarToken,
  autorizarRoles('administrador'),
  categoriaController.crear
);

router.put(
  '/:id',
  verificarToken,
  autorizarRoles('administrador'),
  categoriaController.actualizar
);

router.patch(
  '/:id/estado',
  verificarToken,
  autorizarRoles('administrador'),
  categoriaController.cambiarEstado
);

// Para formularios y filtros de visitantes.
router.get('/', categoriaController.listarPublicas);

module.exports = router;
