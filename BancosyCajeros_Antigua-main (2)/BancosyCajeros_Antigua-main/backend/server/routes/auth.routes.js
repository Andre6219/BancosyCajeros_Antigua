const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const verificarToken = require('../middlewares/autenticacion');
const autorizarRoles = require('../middlewares/autorizacion');
  
router.post('/login', authController.login);

// Protegida: devuelve el perfil del usuario autenticado
router.get('/perfil', verificarToken, authController.perfil);

// Solo el administrador puede crear registradores.
router.post(
  '/registrar',verificarToken, autorizarRoles('administrador'),authController.registrar);

module.exports = router;