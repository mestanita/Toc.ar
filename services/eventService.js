/**
 * Servicio de eventos - Lógica de negocio para gestión de eventos
 */
const Event = require('../models/Event');
const Artist = require('../models/Artist');
const Place = require('../models/Place');
const crypto = require('crypto');
const { calcularDistanciaKm } = require('./geoService');
const { construirUrlSubdominio } = require('./subdomainService');

/**
 * Genera un código corto único para URLs de eventos
 * @returns {string} Código hexadecimal de 6 caracteres
 */
function generarCodigoCorto() {
  return crypto.randomBytes(3).toString('hex');
}

/**
 * Obtiene un código URL único para un nuevo evento
 * @returns {Promise<string>} Código URL único
 */
async function obtenerCodigoUrlUnico() {
  let codigoUrl = generarCodigoCorto();
  while (await Event.findOne({ codigoUrl })) {
    codigoUrl = generarCodigoCorto();
  }
  return codigoUrl;
}

/**
 * Prepara los datos de artistas para un evento
 * @param {Array} artistasIds - IDs de artistas
 * @param {Object} user - Usuario creador
 * @returns {Array} Array de objetos artista con estado de invitación
 */
function prepararArtistas(artistasIds, user) {
  let idsProcesados = Array.isArray(artistasIds) ? artistasIds : (artistasIds ? [artistasIds] : []);
  
  // Si el creador es Artista, se incluye obligatoriamente
  if (user.role === 'Artista' && user.artistProfile) {
    const artIdStr = user.artistProfile.toString();
    if (!idsProcesados.includes(artIdStr)) {
      idsProcesados.unshift(artIdStr);
    }
  }

  // El creador queda ACEPTADO por defecto; los invitados quedan PENDIENTES
  return idsProcesados.map((id, index) => ({
    artistaId: id,
    orden: index,
    estadoInvitacion: (user.role === 'Artista' && user.artistProfile && user.artistProfile.toString() === id) 
      ? 'Aceptado' 
      : 'Pendiente'
  }));
}

/**
 * Determina el estado del lugar para un evento
 * @param {string|null} establecimientoId - ID del establecimiento
 * @param {Object} user - Usuario creador
 * @returns {string} Estado de la invitación al lugar
 */
function determinarEstadoLugar(establecimientoId, user) {
  if (!establecimientoId) return 'NoAplica';
  
  return (user.role === 'Establecimiento' && user.placeProfile && user.placeProfile.toString() === establecimientoId)
    ? 'Aceptado'
    : 'Pendiente';
}

/**
 * Determina el estado general del evento basado en las invitaciones
 * @param {Array} artistasOrdenados - Array de artistas con estado
 * @param {string} estadoLugar - Estado del lugar
 * @returns {string} Estado general del evento
 */
function determinarEstadoGeneral(artistasOrdenados, estadoLugar) {
  const hayArtistasPendientes = artistasOrdenados.some(a => a.estadoInvitacion === 'Pendiente');
  const hayLugarPendiente = (estadoLugar === 'Pendiente');
  
  return (!hayArtistasPendientes && !hayLugarPendiente) ? 'Publicado' : 'Pendiente';
}

/**
 * Obtiene la URL de imagen para un evento (flyer o fallback)
 * @param {Object} req - Request de Express
 * @param {Object} user - Usuario creador
 * @returns {Promise<string>} URL de la imagen
 */
async function obtenerImagenEvento(req, user) {
  if (req.file) {
    return `/uploads/${req.file.filename}`;
  }

  if (user.role === 'Artista' && user.artistProfile) {
    const artist = await Artist.findById(user.artistProfile);
    return artist?.avatar || artist?.logo || 'https://placehold.co/600x400?text=Evento+toc.ar';
  } else if (user.role === 'Establecimiento' && user.placeProfile) {
    const place = await Place.findById(user.placeProfile);
    return place?.logo || 'https://placehold.co/600x400?text=Evento+toc.ar';
  }
  
  return 'https://placehold.co/600x400?text=Evento+toc.ar';
}

/**
 * Enriquece un evento con información adicional para APIs
 * @param {Object} evento - Evento de la base de datos
 * @param {Object} req - Request de Express
 * @param {number|null} userLat - Latitud del usuario
 * @param {number|null} userLng - Longitud del usuario
 * @param {Object} currentUser - Usuario actual (opcional)
 * @returns {Object} Evento enriquecido
 */
async function enriquecerEvento(evento, req, userLat = null, userLng = null, currentUser = null) {
  const ev = evento.toObject ? evento.toObject() : evento;
  
  // Calcular distancia
  const dist = (userLat && userLng && ev.location?.coordinates)
    ? calcularDistanciaKm(userLat, userLng, ev.location.coordinates[1], ev.location.coordinates[0])
    : 0;

  // Obtener artista principal
  const artistaPrincipal = (ev.artistas && ev.artistas.length > 0 && ev.artistas[0].artistaId)
    ? ev.artistas[0].artistaId
    : null;

  const artistaFallback = artistaPrincipal || {
    nombre: ev.establecimiento?.nombre || 'Evento toc.ar',
    avatar: 'https://placehold.co/150x150?text=toc.ar',
    score: 5.0,
    votes: 0,
    subdomain: '#'
  };

  const eventoEnriquecido = {
    ...ev,
    distancia: dist,
    artista: artistaFallback,
    urlArtista: artistaPrincipal ? construirUrlSubdominio(req, artistaPrincipal.subdomain) : '#',
    urlEstablecimiento: ev.establecimiento ? construirUrlSubdominio(req, ev.establecimiento.subdomain) : null
  };

  // Agregar relevancia personal si hay usuario logueado
  if (currentUser) {
    const artistasSeguidosIds = currentUser?.artistasSeguidos?.map(id => id.toString()) || [];
    const lugaresSeguidosIds = currentUser?.establecimientosSeguidos?.map(id => id.toString()) || [];
    const misPreferencias = currentUser?.preferenciasEspectaculos || [];

    let relevanciaPersonal = 0;
    if (artistaPrincipal && artistasSeguidosIds.includes(artistaPrincipal._id.toString())) relevanciaPersonal += 10;
    if (ev.establecimiento && lugaresSeguidosIds.includes(ev.establecimiento._id.toString())) relevanciaPersonal += 5;
    if (artistaPrincipal && misPreferencias.includes(artistaPrincipal.subcategoria)) relevanciaPersonal += 3;

    eventoEnriquecido.relevanciaPersonal = relevanciaPersonal;
  }

  return eventoEnriquecido;
}

module.exports = {
  generarCodigoCorto,
  obtenerCodigoUrlUnico,
  prepararArtistas,
  determinarEstadoLugar,
  determinarEstadoGeneral,
  obtenerImagenEvento,
  enriquecerEvento
};
