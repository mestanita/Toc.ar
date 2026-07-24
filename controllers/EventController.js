const Event = require('../models/Event');
const Artist = require('../models/Artist');
const Place = require('../models/Place');
const crypto = require('crypto');

function generarCodigoCorto() {
  return crypto.randomBytes(3).toString('hex');
}

exports.renderCreateEvent = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.redirect('/auth/login');

    let defaultArtist = null;
    let defaultPlace = null;

    if (user.role === 'Artista' && user.artistProfile) {
      defaultArtist = await Artist.findById(user.artistProfile);
    } else if (user.role === 'Establecimiento' && user.placeProfile) {
      defaultPlace = await Place.findById(user.placeProfile);
    }

    res.render('event', {
      user,
      defaultArtist,
      defaultPlace
    });
  } catch (error) {
    console.error('Error cargando formulario de evento:', error);
    res.status(500).send('Error interno del servidor');
  }
};

exports.searchArtists = async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q || q.length < 2) return res.json([]);
    const artistas = await Artist.find({ nombre: { $regex: q, $options: 'i' } })
      .select('_id nombre avatar subdomain').limit(10);
    res.json(artistas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.searchPlaces = async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q || q.length < 2) return res.json([]);
    const lugares = await Place.find({ nombre: { $regex: q, $options: 'i' } })
      .select('_id nombre subdomain location').limit(10);
    res.json(lugares);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const user = req.user;
    const { 
      nombre, fecha, hora, artistasIds, 
      establecimientoId, direccionManual, manualLat, manualLng,
      tipoEntrada, linkExterno, precioEntrada, preventaHabilitada, fechaInicioPreventa 
    } = req.body;

    const [horas, minutos] = (hora || '21:00').split(':');
    const fechaHoraInicio = new Date(fecha);
    fechaHoraInicio.setHours(parseInt(horas), parseInt(minutos), 0, 0);

    let idsProcesados = Array.isArray(artistasIds) ? artistasIds : (artistasIds ? [artistasIds] : []);
    
    // Si el creador es Artista, se incluye obligatoriamente
    if (user.role === 'Artista' && user.artistProfile) {
      const artIdStr = user.artistProfile.toString();
      if (!idsProcesados.includes(artIdStr)) {
        idsProcesados.unshift(artIdStr);
      }
    }

    // El creador queda ACEPTADO por defecto; los invitados quedan PENDIENTES
    const artistasOrdenados = idsProcesados.map((id, index) => {
      const esElCreador = (user.role === 'Artista' && user.artistProfile && user.artistProfile.toString() === id);
      return {
        artistaId: id,
        orden: index,
        estadoInvitacion: esElCreador ? 'Aceptado' : 'Pendiente'
      };
    });

    let coords = [0, 0];
    let estadoLugar = 'NoAplica';

    if (establecimientoId) {
      const placeDoc = await Place.findById(establecimientoId);
      if (placeDoc && placeDoc.location) {
        coords = placeDoc.location.coordinates;
      }
      // Si el creador es el mismo establecimiento, queda Aceptado; si es un Artista creando en su local, queda Pendiente
      estadoLugar = (user.role === 'Establecimiento' && user.placeProfile && user.placeProfile.toString() === establecimientoId) 
        ? 'Aceptado' 
        : 'Pendiente';
    } else if (manualLat && manualLng) {
      coords = [parseFloat(manualLng), parseFloat(manualLat)];
    }

    // 🖼️ DETERMINAR FLYER O FALLBACK AUTOMÁTICO AL LOGO DEL CREADOR
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    } else {
      if (user.role === 'Artista' && user.artistProfile) {
        const artist = await Artist.findById(user.artistProfile);
        imageUrl = artist?.avatar || artist?.logo || 'https://placehold.co/600x400?text=Evento+toc.ar';
      } else if (user.role === 'Establecimiento' && user.placeProfile) {
        const place = await Place.findById(user.placeProfile);
        imageUrl = place?.logo || 'https://placehold.co/600x400?text=Evento+toc.ar';
      } else {
        imageUrl = 'https://placehold.co/600x400?text=Evento+toc.ar';
      }
    }

    // Verificar si el evento nace 100% aceptado (solo si no hay invitados adicionales)
    const hayArtistasPendientes = artistasOrdenados.some(a => a.estadoInvitacion === 'Pendiente');
    const hayLugarPendiente = (estadoLugar === 'Pendiente');
    const estadoGeneral = (!hayArtistasPendientes && !hayLugarPendiente) ? 'Publicado' : 'Pendiente';

    let codigoUrl = generarCodigoCorto();
    while (await Event.findOne({ codigoUrl })) {
      codigoUrl = generarCodigoCorto();
    }

    const nuevoEvento = new Event({
      nombre,
      codigoUrl,
      imageUrl, // Guarda la imagen subida o el logo/avatar automático
      creatorUser: user._id,
      creatorRole: user.role,
      estadoGeneral,
      fechaInicio: fechaHoraInicio,
      artistas: artistasOrdenados,
      establecimiento: establecimientoId || null,
      estadoInvitacionLugar: estadoLugar,
      direccionManual: !establecimientoId ? direccionManual : null,
      location: { type: 'Point', coordinates: coords },
      tipoEntrada,
      linkExterno: tipoEntrada === 'Link Externo' ? linkExterno : null,
      precioEntrada: tipoEntrada === 'Compra Online' ? (parseFloat(precioEntrada) || 0) : 0,
      preventaHabilitada: tipoEntrada === 'Compra Online' ? (preventaHabilitada === 'true' || preventaHabilitada === true) : true,
      fechaInicioPreventa: (tipoEntrada === 'Compra Online' && preventaHabilitada === 'false' && fechaInicioPreventa) ? new Date(fechaInicioPreventa) : null
    });

    await nuevoEvento.save();
    res.redirect('/panel');
  } catch (error) {
    console.error('Error creando evento:', error);
    res.status(500).send('Error interno al procesar el evento');
  }
};

/**
 * Renderiza el formulario de edición de evento
 */
exports.renderEditEvent = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.redirect('/auth/login');

    const eventId = req.params.id;
    const evento = await Event.findById(eventId);

    if (!evento) {
      return res.status(404).send('Evento no encontrado');
    }

    // Verificar permisos: solo el creador puede editar
    if (evento.creatorUser.toString() !== user._id.toString()) {
      return res.status(403).send('No tienes permisos para editar este evento');
    }

    // CORRECCIÓN: Si direccionManual es un objeto (dato corrupto antiguo), convertirlo a string o null
    if (evento.direccionManual && typeof evento.direccionManual === 'object') {
      // Intentar construir un string legible o simplemente limpiarlo
      const dir = evento.direccionManual;
      evento.direccionManual = `${dir.calle || ''} ${dir.numero || ''}, ${dir.ciudad || ''}, ${dir.provincia || ''}`.trim();
      
      // Guardar la corrección en la BD para futuros accesos
      await Event.findByIdAndUpdate(eventId, { direccionManual: evento.direccionManual });
    }

    let defaultArtist = null;
    let defaultPlace = null;

    if (user.role === 'Artista' && user.artistProfile) {
      defaultArtist = await Artist.findById(user.artistProfile);
    } else if (user.role === 'Establecimiento' && user.placeProfile) {
      defaultPlace = await Place.findById(user.placeProfile);
    }

    // Obtener artistas invitados
    const artistasIds = evento.artistas.map(a => a.artistaId ? a.artistaId.toString() : null).filter(id => id);
    
    // Cargar datos completos de los artistas invitados para mostrar en el formulario
    const artistasData = await Artist.find({ _id: { $in: artistasIds } }).select('_id nombre avatar subdomain');

    res.render('event-edit', {
      user,
      evento,
      defaultArtist,
      defaultPlace,
      artistasIds,
      artistasData
    });
  } catch (error) {
    console.error('Error cargando formulario de edición de evento:', error);
    res.status(500).send('Error interno del servidor');
  }
};

/**
 * Actualiza un evento existente
 */
exports.updateEvent = async (req, res) => {
  try {
    const user = req.user;
    const eventId = req.params.id;
    
    const evento = await Event.findById(eventId);
    if (!evento) {
      return res.status(404).send('Evento no encontrado');
    }

    // Verificar permisos: solo el creador puede editar
    if (evento.creatorUser.toString() !== user._id.toString()) {
      return res.status(403).send('No tienes permisos para editar este evento');
    }

    const { 
      nombre, fecha, hora, artistasIds, 
      establecimientoId, direccionManual, manualLat, manualLng,
      tipoEntrada, linkExterno, precioEntrada, preventaHabilitada, fechaInicioPreventa 
    } = req.body;

    const [horas, minutos] = (hora || '21:00').split(':');
    const fechaHoraInicio = new Date(fecha);
    fechaHoraInicio.setHours(parseInt(horas), parseInt(minutos), 0, 0);

    let idsProcesados = Array.isArray(artistasIds) ? artistasIds : (artistasIds ? [artistasIds] : []);
    
    // Si el creador es Artista, se incluye obligatoriamente
    if (user.role === 'Artista' && user.artistProfile) {
      const artIdStr = user.artistProfile.toString();
      if (!idsProcesados.includes(artIdStr)) {
        idsProcesados.unshift(artIdStr);
      }
    }

    // Mantener el estado de invitación existente para artistas que ya estaban
    const artistasOrdenados = idsProcesados.map((id, index) => {
      const existingInvite = evento.artistas.find(a => a.artistaId && a.artistaId.toString() === id);
      const esElCreador = (user.role === 'Artista' && user.artistProfile && user.artistProfile.toString() === id);
      
      return {
        artistaId: id,
        orden: index,
        estadoInvitacion: existingInvite ? existingInvite.estadoInvitacion : (esElCreador ? 'Aceptado' : 'Pendiente')
      };
    });

    let coords = [0, 0];
    let estadoLugar = evento.estadoInvitacionLugar || 'NoAplica';

    if (establecimientoId) {
      const placeDoc = await Place.findById(establecimientoId);
      if (placeDoc && placeDoc.location) {
        coords = placeDoc.location.coordinates;
      }
      // Mantener estado si ya existía, sino aplicar lógica nueva
      if (evento.establecimiento && evento.establecimiento.toString() === establecimientoId) {
        estadoLugar = evento.estadoInvitacionLugar;
      } else {
        estadoLugar = (user.role === 'Establecimiento' && user.placeProfile && user.placeProfile.toString() === establecimientoId) 
          ? 'Aceptado' 
          : 'Pendiente';
      }
    } else if (manualLat && manualLng) {
      coords = [parseFloat(manualLng), parseFloat(manualLat)];
    }

    // 🖼️ DETERMINAR FLYER O MANTENER EL EXISTENTE
    let imageUrl = evento.imageUrl;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Verificar si hubo cambios en los invitados (artistas o establecimiento)
    const artistasOriginalesIds = evento.artistas.map(a => a.artistaId ? a.artistaId.toString() : null).filter(id => id);
    const hayCambiosArtistas = JSON.stringify(artistasOriginalesIds.sort()) !== JSON.stringify(idsProcesados.sort());
    const hayCambiosEstablecimiento = !evento.establecimiento && establecimientoId || 
                                       evento.establecimiento && (!establecimientoId || evento.establecimiento.toString() !== establecimientoId);
    
    // Si hubo cambios en invitados, el evento queda Pendiente hasta que todos aprueben
    if (hayCambiosArtistas || hayCambiosEstablecimiento) {
      // Resetear estados de invitación para los nuevos/eliminados
      artistasOrdenados.forEach(artObj => {
        const esElCreador = (user.role === 'Artista' && user.artistProfile && user.artistProfile.toString() === artObj.artistaId);
        const existiaAntes = artistasOriginalesIds.includes(artObj.artistaId);
        
        if (!existiaAntes && !esElCreador) {
          artObj.estadoInvitacion = 'Pendiente'; // Nuevo invitado
        }
      });
      
      if (hayCambiosEstablecimiento && estadoLugar !== 'NoAplica') {
        estadoLugar = (user.role === 'Establecimiento' && user.placeProfile && user.placeProfile.toString() === establecimientoId) 
          ? 'Aceptado' 
          : 'Pendiente';
      }
    }

    // Verificar si el evento nace 100% aceptado
    const hayArtistasPendientes = artistasOrdenados.some(a => a.estadoInvitacion === 'Pendiente');
    const hayLugarPendiente = (estadoLugar === 'Pendiente');
    const estadoGeneral = (!hayArtistasPendientes && !hayLugarPendiente) ? 'Publicado' : 'Pendiente';

    // CORRECCIÓN: Asegurar que direccionManual sea un string o null antes de guardar
    let direccionManualFinal = null;
    if (!establecimientoId) {
      // Si es un objeto (dato corrupto), intentar convertirlo
      if (typeof direccionManual === 'object' && direccionManual !== null) {
        const dir = direccionManual;
        direccionManualFinal = `${dir.calle || ''} ${dir.numero || ''}, ${dir.ciudad || ''}, ${dir.provincia || ''}`.trim();
      } else if (typeof direccionManual === 'string') {
        direccionManualFinal = direccionManual;
      }
    }

    await Event.findByIdAndUpdate(eventId, {
      nombre,
      estadoGeneral,
      fechaInicio: fechaHoraInicio,
      artistas: artistasOrdenados,
      establecimiento: establecimientoId || null,
      estadoInvitacionLugar: estadoLugar,
      direccionManual: direccionManualFinal,
      location: { type: 'Point', coordinates: coords },
      tipoEntrada,
      linkExterno: tipoEntrada === 'Link Externo' ? linkExterno : null,
      precioEntrada: tipoEntrada === 'Compra Online' ? (parseFloat(precioEntrada) || 0) : 0,
      preventaHabilitada: tipoEntrada === 'Compra Online' ? (preventaHabilitada === 'true' || preventaHabilitada === true) : true,
      fechaInicioPreventa: (tipoEntrada === 'Compra Online' && preventaHabilitada === 'false' && fechaInicioPreventa) ? new Date(fechaInicioPreventa) : null,
      imageUrl
    });

    res.redirect('/panel');
  } catch (error) {
    console.error('Error actualizando evento:', error);
    res.status(500).send('Error interno al actualizar el evento');
  }
};