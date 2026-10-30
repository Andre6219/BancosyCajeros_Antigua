'use strict';

const { Op } = require('sequelize');

const DISTANCIA_DUPLICADO_METROS = 50;

const normalizarTexto = (texto) =>
  String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const distanciaEnMetros = (lat1, lon1, lat2, lon2) => {
  const radioTierra = 6371000;
  const radianes = (grados) => (grados * Math.PI) / 180;
  const diferenciaLatitud = radianes(lat2 - lat1);
  const diferenciaLongitud = radianes(lon2 - lon1);
  const a =
    Math.sin(diferenciaLatitud / 2) ** 2 +
    Math.cos(radianes(lat1)) *
      Math.cos(radianes(lat2)) *
      Math.sin(diferenciaLongitud / 2) ** 2;
  const aLimitada = Math.min(1, Math.max(0, a));

  return 2 * radioTierra * Math.atan2(
    Math.sqrt(aLimitada),
    Math.sqrt(1 - aLimitada)
  );
};

const buscarPosiblesDuplicados = async ({
  Lugar,
  Entidad,
  datos,
  excluirId
}) => {
  const where = {
    entidad_id: datos.entidad_id,
    tipo: datos.tipo
  };

  if (excluirId !== undefined && excluirId !== null) {
    where.id = { [Op.ne]: excluirId };
  }

  const candidatos = await Lugar.findAll({
    where,
    attributes: [
      'id',
      'nombre',
      'entidad_id',
      'tipo',
      'direccion',
      'latitud',
      'longitud',
      'estado_revision',
      'activo'
    ],
    include: [
      {
        model: Entidad,
        as: 'entidad',
        attributes: ['id', 'nombre']
      }
    ],
    order: [['id', 'ASC']]
  });

  const nombreBuscado = normalizarTexto(datos.nombre);
  const direccionBuscada = normalizarTexto(datos.direccion);

  return candidatos
    .map((candidato) => {
      const razones = [];
      const distancia = distanciaEnMetros(
        Number(datos.latitud),
        Number(datos.longitud),
        Number(candidato.latitud),
        Number(candidato.longitud)
      );

      if (normalizarTexto(candidato.nombre) === nombreBuscado) {
        razones.push('nombre');
      }

      if (normalizarTexto(candidato.direccion) === direccionBuscada) {
        razones.push('direccion');
      }

      if (distancia <= DISTANCIA_DUPLICADO_METROS) {
        razones.push('ubicacion_cercana');
      }

      if (razones.length === 0) return null;

      return {
        id: candidato.id,
        nombre: candidato.nombre,
        entidad_id: candidato.entidad_id,
        entidad: candidato.entidad
          ? { id: candidato.entidad.id, nombre: candidato.entidad.nombre }
          : null,
        tipo: candidato.tipo,
        direccion: candidato.direccion,
        latitud: candidato.latitud,
        longitud: candidato.longitud,
        estado_revision: candidato.estado_revision,
        activo: candidato.activo,
        distancia_metros: Math.round(distancia),
        coincidencias: razones
      };
    })
    .filter(Boolean);
};

module.exports = {
  buscarPosiblesDuplicados,
  DISTANCIA_DUPLICADO_METROS
};
