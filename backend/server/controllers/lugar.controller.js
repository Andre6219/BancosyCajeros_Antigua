const { Op } = require('sequelize');
const estaDentroDeAntigua = require('../validar-antigua');
const {
  buscarPosiblesDuplicados,
  DISTANCIA_DUPLICADO_METROS
} = require('../detectar-duplicados');
const {
  Lugar,
  Entidad,
  Categoria,
  Ubicacion,
  Usuario
} = require('../../models');

//lugar.controller devuelve los lugares públicos aprobados y activos, con filtros opcionales de tipo y texto de búsqueda. También permite obtener el detalle de un lugar específico por su ID, siempre que esté aprobado y activo.
//genera el enlace de Google Maps usando las coordenadas de latitud y longitud del lugar.

const responderPosiblesDuplicados = (res, posiblesDuplicados) =>
  res.status(409).json({
    code: 'POSIBLES_DUPLICADOS',
    message:
      'Se encontraron lugares que podrían ser duplicados. Revísalos y confirma si deseas continuar.',
    distancia_umbral_metros: DISTANCIA_DUPLICADO_METROS,
    posiblesDuplicados
  });

const incluirDatosRelacionados = [
  {
    model: Entidad,
    as: 'entidad',
    attributes: ['id', 'nombre', 'sitio_web']
  },
  {
    model: Categoria,
    as: 'categoria',
    attributes: ['id', 'nombre']
  },
  {
    model: Ubicacion,
    as: 'ubicacion',
    attributes: ['id', 'municipio', 'departamento']
  }
];

// Convierte el registro en datos públicos y genera su enlace de Maps.
const prepararLugarPublico = (lugar) => {
  const datos = lugar.toJSON();

  datos.enlace_maps =
    `https://www.google.com/maps?q=${datos.latitud},${datos.longitud}`;

  return datos;
};

// GET /api/lugares
// Consulta pública de lugares aprobados y activos.
// Filtros opcionales: ?tipo=agencia y ?q=banco
exports.listarPublicos = async (req, res) => {
  try {
    const { tipo, q, categoria_id } = req.query;

    if (tipo !== undefined && !['agencia', 'cajero'].includes(tipo)) {
      return res.status(400).json({
        message: 'El filtro tipo debe ser agencia o cajero'
      });
    }

    let categoriaId = null;
    if (categoria_id !== undefined) {
      categoriaId = Number(categoria_id);
      if (!Number.isSafeInteger(categoriaId) || categoriaId <= 0) {
        return res.status(400).json({
          message: 'El filtro categoria_id debe ser un entero positivo'
        });
      }
    }

    if (
      q !== undefined &&
      (typeof q !== 'string' || q.trim().length > 100)
    ) {
      return res.status(400).json({
        message: 'El texto de búsqueda no puede superar 100 caracteres'
      });
    }

    const where = {
      estado_revision: 'aprobado',
      activo: true
    };

    if (tipo) {
      where.tipo = tipo;
    }

    if (categoriaId !== null) {
      where.categoria_id = categoriaId;
    }

    if (q && q.trim() !== '') {
      const texto = `%${q.trim()}%`;

      where[Op.or] = [
        { nombre: { [Op.iLike]: texto } },
        { direccion: { [Op.iLike]: texto } }
      ];
    }

    const resultados = await Lugar.findAll({
      where,
      attributes: [
        'id',
        'nombre',
        'entidad_id',
        'categoria_id',
        'tipo',
        'ubicacion_id',
        'direccion',
        'latitud',
        'longitud'
      ],
      include: incluirDatosRelacionados,
      order: [['nombre', 'ASC']]
    });

    const lugares = resultados
      .filter((lugar) =>
        estaDentroDeAntigua(Number(lugar.latitud), Number(lugar.longitud))
      )
      .map(prepararLugarPublico);

    return res.status(200).json({
      total: lugares.length,
      lugares
    });
  } catch (error) {
    console.error('Error al listar lugares:', error.name);

    return res.status(500).json({
      message: 'Error interno al consultar los lugares'
    });
  }
};

// GET /api/lugares/:id
// Consulta pública del detalle, solo si está aprobado y activo.
exports.obtenerPublicoPorId = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'El identificador del lugar no es válido'
      });
    }

    const resultado = await Lugar.findOne({
      where: {
        id,
        estado_revision: 'aprobado',
        activo: true
      },
      attributes: [
        'id',
        'nombre',
        'entidad_id',
        'categoria_id',
        'tipo',
        'ubicacion_id',
        'direccion',
        'latitud',
        'longitud'
      ],
      include: incluirDatosRelacionados
    });

    if (
      !resultado ||
      !estaDentroDeAntigua(
        Number(resultado.latitud),
        Number(resultado.longitud)
      )
    ) {
      return res.status(404).json({
        message: 'Lugar no encontrado'
      });
    }

    return res.status(200).json({
      lugar: prepararLugarPublico(resultado)
    });
  } catch (error) {
    console.error('Error al consultar lugar:', error.name);

    return res.status(500).json({
      message: 'Error interno al consultar el lugar'
    });
  }
};

// POST /api/lugares/verificar-duplicados
// Comprueba posibles coincidencias sin guardar el lugar.
exports.verificarDuplicados = async (req, res) => {
  try {
    const cuerpo = req.body || {};
    const entidadId = Number(cuerpo.entidad_id);
    const latitud = Number(cuerpo.latitud);
    const longitud = Number(cuerpo.longitud);
    const { nombre, direccion, tipo } = cuerpo;

    if (
      !Number.isSafeInteger(entidadId) ||
      entidadId <= 0 ||
      typeof nombre !== 'string' ||
      nombre.trim() === '' ||
      nombre.trim().length > 255 ||
      typeof direccion !== 'string' ||
      direccion.trim() === '' ||
      direccion.trim().length > 255 ||
      !['agencia', 'cajero'].includes(tipo) ||
      cuerpo.latitud === '' ||
      cuerpo.longitud === '' ||
      !Number.isFinite(latitud) ||
      latitud < -90 ||
      latitud > 90 ||
      !Number.isFinite(longitud) ||
      longitud < -180 ||
      longitud > 180
    ) {
      return res.status(400).json({
        message: 'Envía entidad, tipo, nombre, dirección y coordenadas válidas'
      });
    }

    if (!estaDentroDeAntigua(latitud, longitud)) {
      return res.status(400).json({
        message: 'Las coordenadas deben estar dentro del municipio de Antigua Guatemala'
      });
    }

    const entidad = await Entidad.findByPk(entidadId);
    if (!entidad) {
      return res.status(400).json({
        message: 'La entidad bancaria no existe'
      });
    }

    const posiblesDuplicados = await buscarPosiblesDuplicados({
      Lugar,
      Entidad,
      datos: {
        entidad_id: entidadId,
        tipo,
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        latitud,
        longitud
      }
    });

    return res.status(200).json({
      total: posiblesDuplicados.length,
      requiere_confirmacion: posiblesDuplicados.length > 0,
      distancia_umbral_metros: DISTANCIA_DUPLICADO_METROS,
      posiblesDuplicados
    });
  } catch (error) {
    console.error('Error al revisar duplicados:', error.name);
    return res.status(500).json({
      message: 'Error interno al revisar posibles duplicados'
    });
  }
};

// POST /api/lugares 
// El administrador crea lugares aprobados 
// El registrador crea lugares pendientes 
exports.crear = async (req, res) => {
  try {
    const usuario = req.usuario;

    if (!usuario || !['administrador', 'registrador'].includes(usuario.rol)) {
      return res.status(403).json({
        message: 'No tienes permiso para crear lugares'
      });
    }

    const {
      nombre,
      entidad_id,
      categoria_id,
      ubicacion_id,
      tipo,
      direccion,
      latitud,
      longitud,
      confirmar_posible_duplicado
    } = req.body || {};

    const entidadId = Number(entidad_id);
    const categoriaId = Number(categoria_id);
    const ubicacionId = Number(ubicacion_id);
    const lat = Number(latitud);
    const lng = Number(longitud);

    if (
      confirmar_posible_duplicado !== undefined &&
      typeof confirmar_posible_duplicado !== 'boolean'
    ) {
      return res.status(400).json({
        message: 'confirmar_posible_duplicado debe ser true o false'
      });
    }

    if (
      typeof nombre !== 'string' ||
      nombre.trim() === '' ||
      !Number.isSafeInteger(entidadId) ||
      entidadId <= 0 ||
      !Number.isSafeInteger(categoriaId) ||
      categoriaId <= 0 ||
      !Number.isSafeInteger(ubicacionId) ||
      ubicacionId <= 0 ||
      !['agencia', 'cajero'].includes(tipo) ||
      typeof direccion !== 'string' ||
      direccion.trim() === '' ||
      latitud === '' ||
      longitud === '' ||
      !Number.isFinite(lat) ||
      lat < -90 ||
      lat > 90 ||
      !Number.isFinite(lng) ||
      lng < -180 ||
      lng > 180
    ) {
      return res.status(400).json({
        message: 'Revisa los datos del lugar y sus coordenadas'
      });
    }

    if (!estaDentroDeAntigua(lat, lng)) {
      return res.status(400).json({
        message: 'Las coordenadas deben estar dentro del municipio de Antigua Guatemala'
      });
    }

    const [entidad, categoria, ubicacion] = await Promise.all([
      Entidad.findByPk(entidadId),
      Categoria.findByPk(categoriaId),
      Ubicacion.findOne({
        where: {
          id: ubicacionId,
          municipio: 'Antigua Guatemala',
          departamento: 'Sacatepéquez'
        }
      })
    ]);

    if (!entidad || !categoria || !categoria.activo || !ubicacion) {
      return res.status(400).json({
        message: 'La entidad, categoría activa o ubicación no es válida'
      });
    }

    const posiblesDuplicados = await buscarPosiblesDuplicados({
      Lugar,
      Entidad,
      datos: {
        entidad_id: entidadId,
        tipo,
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        latitud: lat,
        longitud: lng
      }
    });

    if (
      posiblesDuplicados.length > 0 &&
      confirmar_posible_duplicado !== true
    ) {
      return responderPosiblesDuplicados(res, posiblesDuplicados);
    }

    const lugar = await Lugar.create({
      nombre: nombre.trim(),
      entidad_id: entidadId,
      categoria_id: categoriaId,
      ubicacion_id: ubicacionId,
      tipo,
      direccion: direccion.trim(),
      latitud: lat,
      longitud: lng,
      creado_por: usuario.id,
      estado_revision:
        usuario.rol === 'administrador' ? 'aprobado' : 'pendiente',
      activo: true
    });

    return res.status(201).json({
      message:
        usuario.rol === 'administrador'
          ? 'Lugar creado y publicado'
          : 'Lugar creado y enviado a revisión',
      id: lugar.id
    });
  } catch (error) {
    console.error('Error al crear lugar:', error.name);

    return res.status(500).json({
      message: 'Error interno al crear el lugar'
    });
  }
};

// PUT /api/lugares/:id
// Administrador: puede editar cualquier lugar 
// Registrador: solo puede editar sus propios lugares pendientes 
exports.actualizar = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const usuario = req.usuario;
    const cuerpo = req.body;

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'El identificador del lugar no es válido'
      });
    }

    if (
      !usuario ||
      !['administrador', 'registrador'].includes(usuario.rol)
    ) {
      return res.status(403).json({
        message: 'No tienes permiso para editar lugares'
      });
    }

    if (!cuerpo || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) {
      return res.status(400).json({
        message: 'Envía los datos del lugar en formato JSON'
      });
    }

    const lugar = await Lugar.findByPk(id);

    if (!lugar) {
      return res.status(404).json({
        message: 'Lugar no encontrado'
      });
    }

    if (
      usuario.rol === 'registrador' &&
      (Number(lugar.creado_por) !== Number(usuario.id) ||
        lugar.estado_revision !== 'pendiente')
    ) {
      return res.status(403).json({
        message: 'Solo puedes editar tus propios lugares pendientes'
      });
    }

    const camposPermitidos = [
      'nombre',
      'entidad_id',
      'categoria_id',
      'ubicacion_id',
      'tipo',
      'direccion',
      'latitud',
      'longitud',
      'confirmar_posible_duplicado'
    ];

    const camposRecibidos = Object.keys(cuerpo);
    const camposNoPermitidos = camposRecibidos.filter(
      (campo) => !camposPermitidos.includes(campo)
    );

    if (camposNoPermitidos.length > 0) {
      return res.status(400).json({
        message: 'No puedes modificar campos internos del lugar',
        camposNoPermitidos
      });
    }

    const confirmarPosibleDuplicado = cuerpo.confirmar_posible_duplicado;
    if (
      confirmarPosibleDuplicado !== undefined &&
      typeof confirmarPosibleDuplicado !== 'boolean'
    ) {
      return res.status(400).json({
        message: 'confirmar_posible_duplicado debe ser true o false'
      });
    }

    const camposDeLugar = camposRecibidos.filter(
      (campo) => campo !== 'confirmar_posible_duplicado'
    );
    if (camposDeLugar.length === 0) {
      return res.status(400).json({
        message: 'Envía al menos un campo del lugar para actualizar'
      });
    }

    const cambios = {};

    for (const campo of ['nombre', 'direccion']) {
      if (Object.prototype.hasOwnProperty.call(cuerpo, campo)) {
        if (
          typeof cuerpo[campo] !== 'string' ||
          cuerpo[campo].trim() === ''
        ) {
          return res.status(400).json({
            message: `${campo} debe ser un texto no vacío`
          });
        }

        cambios[campo] = cuerpo[campo].trim();
      }
    }

    for (const campo of [
      'entidad_id',
      'categoria_id',
      'ubicacion_id'
    ]) {
      if (Object.prototype.hasOwnProperty.call(cuerpo, campo)) {
        const valor = Number(cuerpo[campo]);

        if (!Number.isSafeInteger(valor) || valor <= 0) {
          return res.status(400).json({
            message: `${campo} debe ser un identificador entero positivo`
          });
        }

        cambios[campo] = valor;
      }
    }

    if (Object.prototype.hasOwnProperty.call(cuerpo, 'tipo')) {
      if (!['agencia', 'cajero'].includes(cuerpo.tipo)) {
        return res.status(400).json({
          message: 'tipo debe ser agencia o cajero'
        });
      }

      cambios.tipo = cuerpo.tipo;
    }

    for (const [campo, minimo, maximo] of [
      ['latitud', -90, 90],
      ['longitud', -180, 180]
    ]) {
      if (Object.prototype.hasOwnProperty.call(cuerpo, campo)) {
        const valor =
          typeof cuerpo[campo] === 'string' && cuerpo[campo].trim() === ''
            ? NaN
            : Number(cuerpo[campo]);

        if (!Number.isFinite(valor) || valor < minimo || valor > maximo) {
          return res.status(400).json({
            message: `${campo} está fuera del rango permitido`
          });
        }

        cambios[campo] = valor;
      }
    }

    const latitudFinal = cambios.latitud ?? Number(lugar.latitud);
    const longitudFinal = cambios.longitud ?? Number(lugar.longitud);

    if (!estaDentroDeAntigua(latitudFinal, longitudFinal)) {
      return res.status(400).json({
        message: 'Las coordenadas deben estar dentro del municipio de Antigua Guatemala'
      });
    }

    // Comprobamos que las referencias resultantes existan.
    const entidadId = cambios.entidad_id ?? lugar.entidad_id;
    const categoriaId = cambios.categoria_id ?? lugar.categoria_id;
    const ubicacionId = cambios.ubicacion_id ?? lugar.ubicacion_id;

    const [entidad, categoria, ubicacion] = await Promise.all([
      Entidad.findByPk(entidadId),
      Categoria.findByPk(categoriaId),
      Ubicacion.findOne({
        where: {
          id: ubicacionId,
          municipio: 'Antigua Guatemala',
          departamento: 'Sacatepéquez'
        }
      })
    ]);

    if (
      !entidad ||
      !categoria ||
      (cambios.categoria_id !== undefined && !categoria.activo) ||
      !ubicacion
    ) {
      return res.status(400).json({
        message: 'La entidad, categoría activa o ubicación no es válida'
      });
    }

    const camposQueAfectanDuplicados = [
      'nombre',
      'entidad_id',
      'tipo',
      'direccion',
      'latitud',
      'longitud'
    ];
    const debeRevisarDuplicados = camposQueAfectanDuplicados.some((campo) =>
      Object.prototype.hasOwnProperty.call(cuerpo, campo)
    );

    if (debeRevisarDuplicados) {
      const posiblesDuplicados = await buscarPosiblesDuplicados({
        Lugar,
        Entidad,
        excluirId: id,
        datos: {
          entidad_id: cambios.entidad_id ?? lugar.entidad_id,
          tipo: cambios.tipo ?? lugar.tipo,
          nombre: cambios.nombre ?? lugar.nombre,
          direccion: cambios.direccion ?? lugar.direccion,
          latitud: latitudFinal,
          longitud: longitudFinal
        }
      });

      if (
        posiblesDuplicados.length > 0 &&
        confirmarPosibleDuplicado !== true
      ) {
        return responderPosiblesDuplicados(res, posiblesDuplicados);
      }
    }

    // Repetimos las condiciones del registrador en la actualización.
    // Así no se actualiza si dejó de pertenecerle o ya no está pendiente.
    const condiciones = { id };

    if (usuario.rol === 'registrador') {
      condiciones.creado_por = usuario.id;
      condiciones.estado_revision = 'pendiente';
    }

    const [cantidadActualizada] = await Lugar.update(cambios, {
      where: condiciones,
      validate: true
    });

    if (cantidadActualizada === 0) {
      return res.status(409).json({
        message: 'El lugar cambió o ya no está disponible para editar'
      });
    }

    return res.status(200).json({
      message: 'Lugar actualizado correctamente'
    });
  } catch (error) {
    if (
      error.name === 'SequelizeValidationError' ||
      error.name === 'SequelizeForeignKeyConstraintError'
    ) {
      return res.status(400).json({
        message: 'Revisa los datos enviados y sus referencias'
      });
    }

    console.error('Error al actualizar lugar:', error.name);

    return res.status(500).json({
      message: 'Error interno al actualizar el lugar'
    });
  }
};

// GET /api/lugares/mis-registros
// Requiere token y rol registrador
exports.misRegistros = async (req, res) => {
  try {
    const usuario = req.usuario;

    if (!usuario || usuario.rol !== 'registrador') {
      return res.status(403).json({
        message: 'Esta consulta es solo para registradores'
      });
    }

    const { estado } = req.query;

    if (
      estado !== undefined &&
      !['pendiente', 'aprobado'].includes(estado)
    ) {
      return res.status(400).json({
        message: 'El estado debe ser pendiente o aprobado'
      });
    }

    const where = {
      creado_por: usuario.id
    };

    if (estado) {
      where.estado_revision = estado;
    }

    const registros = await Lugar.findAll({
      where,
      attributes: [
        'id',
        'nombre',
        'entidad_id',
        'categoria_id',
        'tipo',
        'ubicacion_id',
        'direccion',
        'latitud',
        'longitud',
        'estado_revision',
        'activo',
        'createdAt',
        'updatedAt'
      ],
      include: incluirDatosRelacionados,
      order: [['updatedAt', 'DESC']]
    });

    return res.status(200).json({
      total: registros.length,
      registros
    });
  } catch (error) {
    console.error('Error al consultar mis registros:', error.name);

    return res.status(500).json({
      message: 'Error interno al consultar tus registros'
    });
  }
};

// GET /api/lugares/admin/pendientes
// El administrador consulta los lugares que esperan revisión.
exports.listarPendientes = async (req, res) => {
  try {
    const registros = await Lugar.findAll({
      where: {
        estado_revision: 'pendiente'
      },
      attributes: [
        'id',
        'nombre',
        'entidad_id',
        'categoria_id',
        'tipo',
        'ubicacion_id',
        'direccion',
        'latitud',
        'longitud',
        'creado_por',
        'estado_revision',
        'activo',
        'createdAt',
        'updatedAt'
      ],
      include: [
        ...incluirDatosRelacionados,
        {
          model: Usuario,
          as: 'creador',
          attributes: ['id', 'nombre', 'email']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    return res.status(200).json({
      total: registros.length,
      registros
    });
  } catch (error) {
    console.error('Error al listar pendientes:', error.name);

    return res.status(500).json({
      message: 'Error interno al consultar los registros pendientes'
    });
  }
};


exports.adminListarTodos = async (req, res) => {
  try {
    const registros = await Lugar.findAll({
      attributes: [
        'id',
        'nombre',
        'entidad_id',
        'categoria_id',
        'tipo',
        'ubicacion_id',
        'direccion',
        'latitud',
        'longitud',
        'creado_por',
        'estado_revision',
        'activo',
        'createdAt',
        'updatedAt'
      ],
      include: [
        ...incluirDatosRelacionados,
        {
          model: Usuario,
          as: 'creador',
          attributes: ['id', 'nombre', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      total: registros.length,
      registros
    });
  } catch (error) {
    console.error('Error al listar todos los lugares para admin:', error.name);

    return res.status(500).json({
      message: 'Error interno al consultar todos los lugares'
    });
  }
};

// PATCH /api/lugares/:id/revision
// El administrador aprueba un registro pendiente.
exports.aprobar = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'El identificador del lugar no es válido'
      });
    }

    const lugar = await Lugar.findByPk(id);

    if (!lugar) {
      return res.status(404).json({
        message: 'Lugar no encontrado'
      });
    }

    if (
      !estaDentroDeAntigua(Number(lugar.latitud), Number(lugar.longitud))
    ) {
      return res.status(400).json({
        message: 'No se puede aprobar: las coordenadas deben estar dentro del municipio de Antigua Guatemala'
      });
    }

    if (lugar.estado_revision !== 'pendiente') {
      return res.status(409).json({
        message: 'Solo se pueden aprobar lugares pendientes'
      });
    }

    await lugar.update({
      estado_revision: 'aprobado'
    });

    return res.status(200).json({
      message: 'Lugar aprobado correctamente'
    });
  } catch (error) {
    console.error('Error al aprobar lugar:', error.name);

    return res.status(500).json({
      message: 'Error interno al aprobar el lugar'
    });
  }
};

// PATCH /api/lugares/:id/estado
// El administrador puede activar o desactivar un lugar
exports.cambiarEstado = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { activo } = req.body || {};

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'El identificador del lugar no es válido'
      });
    }

    if (typeof activo !== 'boolean') {
      return res.status(400).json({
        message: 'activo debe ser true o false'
      });
    }

    const lugar = await Lugar.findByPk(id);

    if (!lugar) {
      return res.status(404).json({
        message: 'Lugar no encontrado'
      });
    }

    await lugar.update({ activo });

    return res.status(200).json({
      message: activo
        ? 'Lugar activado correctamente'
        : 'Lugar desactivado correctamente',
      activo: lugar.activo
    });
  } catch (error) {
    console.error('Error al cambiar estado del lugar:', error.name);

    return res.status(500).json({
      message: 'Error interno al cambiar el estado del lugar'
    });
  }
};