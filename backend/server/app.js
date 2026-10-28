const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const lugarRoutes = require('./routes/lugar.routes');

const app = express();

// Utiliza el origen configurado en .env
// Mientras trabajan localmente, el valor predeterminado es Angular
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  return res.status(200).json({
    message: 'API de bancos y cajeros de Antigua Guatemala'
  });
});

app.get('/api/health', (req, res) => {
  return res.status(200).json({
    message: 'Servidor funcionando correctamente'
  });
});

// Inicio de sesión, perfil y creación de registradores.
app.use('/api/auth', authRoutes);

// Operaciones de lugares.
app.use('/api/lugares', lugarRoutes);

// Respuesta para direcciones que no existen
app.use((req, res) => {
  return res.status(404).json({
    message: 'Ruta no encontrada'
  });
});

// Manejo general de errores
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      message: 'El cuerpo de la petición contiene un JSON inválido'
    });
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      message: 'El cuerpo de la petición es demasiado grande'
    });
  }

  console.error('Error en la aplicación:', error.name);

  return res.status(500).json({
    message: 'Error interno del servidor'
  });
});

const lugarRoutes = require('./routes/lugar.routes');

app.use('/api/lugares', lugarRoutes);

module.exports = app;