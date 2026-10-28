const express = require('express');
const router = express.Router();

const lugarController = require('../controllers/lugar.controller');
const verificarToken = require('../middlewares/autenticacion');
const autorizarRoles = require('../middlewares/autorizacion');

router.get('/mis-registros', verificarToken, autorizarRoles('registrador'), lugarController.misRegistros);

router.get(
  '/admin/todos',
  verificarToken,
  autorizarRoles('administrador'),
  lugarController.adminListarTodos
);

router.get(
  '/admin/pendientes',
  verificarToken,
  autorizarRoles('administrador'),
  lugarController.listarPendientes
);

router.patch(
  '/:id/revision',
  verificarToken,
  autorizarRoles('administrador'),
  lugarController.aprobar
);

router.patch(
  '/:id/estado',
  verificarToken,
  autorizarRoles('administrador'),
  lugarController.cambiarEstado
);

router.get('/', lugarController.listarPublicos);
router.get('/:id', lugarController.obtenerPublicoPorId);

router.post('/', verificarToken, autorizarRoles('administrador', 'registrador'), lugarController.crear);
router.put('/:id', verificarToken, autorizarRoles('administrador', 'registrador'), lugarController.actualizar);

module.exports = router;