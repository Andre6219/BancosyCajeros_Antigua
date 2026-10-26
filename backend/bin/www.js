const path = require('path');

// Carga backend/.env independientemente de dónde ejecutes Node
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});

const app = require('../server/app');
const db = require('../models');

const PORT = Number(process.env.PORT || 8030);

async function iniciarServidor() {
  try {
    if (
      !Number.isInteger(PORT) ||
      PORT < 1 ||
      PORT > 65535
    ) {
      throw new Error('PORT debe ser un entero entre 1 y 65535');
    }

    // Comprueba la conexión sin crear ni modificar tablas.
    await db.sequelize.authenticate();
    console.log('Conexión a PostgreSQL correcta');

    const servidor = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });

    servidor.on('error', async (error) => {
      console.error('No se pudo iniciar el servidor:', error.message);

      try {
        await db.sequelize.close();
      } catch {
        console.error('No se pudo cerrar la conexión');
      }

      process.exitCode = 1;
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);

    try {
      await db.sequelize.close();
    } catch {
      console.error('No se pudo cerrar la conexión');
    }

    process.exitCode = 1;
  }
}

iniciarServidor();