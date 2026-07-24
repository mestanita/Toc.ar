const Event = require('../models/Event');
const Artist = require('../models/Artist');
const Place = require('../models/Place');
const crypto = require('crypto');

// Generador de código alfanumérico corto (ej: "a7x9b2")
function generarCodigoCorto() {
  return crypto.randomBytes(3).toString('hex');
}

// GET: Renderizar pantalla de creación de evento (event.ejs)
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

// GET API: Autocompletar Artistas (AJAX)
exports.searchArtists = async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q || q.length < 2) return res.json([]);
    
    const artistas = await Artist.find({ 
      nombre: { $regex: q, $options: 'i' } 
    }).select('_id nombre avatar subdomain').limit(10);

    res.json(artistas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET API: Autocompletar Establecimientos (AJAX)
exports.searchPlaces = async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q || q.length < 2) return res.json([]);

    const lugares = await Place.find({ 
      nombre: { $regex: q, $options: 'i' } 
    }).select('_id nombre banner subdomain location').limit(10);

    res.json(lugares);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST: Guardar nuevo evento
exports.createEvent = async (req, res) => {
  try {
    const user = req.user;
    const { 
      nombre, fecha, hora, artistasIds, 
      establecimientoId, calle, numero, ciudad, provincia,
      tipoEntrada, linkExterno, precioEntrada, preventaHabilitada, fechaInicioPreventa 
    } = req.body;

    // Fusionar fecha y hora
    const [horas, minutos] = (hora || '21:00').split(':');
    const fechaHoraInicio = new Date(fecha);
    fechaHoraInicio.setHours(parseInt(horas), parseInt(minutos), 0, 0);

    // Procesar lista ordenada de artistas
    let idsProcesados = Array.isArray(artistasIds) ? artistasIds : (artistasIds ? [artistasIds] : []);
    
    // Si es creador Artista, garantizar que esté incluido obligatoriamente
    if (user.role === 'Artista' && user.artistProfile) {
      const artIdStr = user.artistProfile.toString();
      if (!idsProcesados.includes(artIdStr)) {
        idsProcesados.unshift(artIdStr);
      }
    }

    const artistasOrdenados = idsProcesados.map((id, index) => ({
      artistaId: id,
      orden: index
    }));

    // Ubicación y Establecimiento
    let placeDoc = null;
    let coords = [0, 0];
    if (establecimientoId) {
      placeDoc = await Place.findById(establecimientoId);
      if (placeDoc && placeDoc.location) {
        coords = placeDoc.location.coordinates;
      }
    }

    // Código dinámico único
    let codigoUrl = generarCodigoCorto();
    while (await Event.findOne({ codigoUrl })) {
      codigoUrl = generarCodigoCorto();
    }

    const nuevoEvento = new Event({
      nombre,
      codigoUrl,
      creatorUser: user._id,
      creatorRole: user.role,
      fechaInicio: fechaHoraInicio,
      artistas: artistasOrdenados,
      establecimiento: establecimientoId || null,
      direccionManual: !establecimientoId ? { calle, numero, ciudad, provincia } : undefined,
      location: { type: 'Point', coordinates: coords },
      tipoEntrada,
      linkExterno: tipoEntrada === 'Link Externo' ? linkExterno : null,
      precioEntrada: tipoEntrada === 'Compra Online' ? (parseFloat(precioEntrada) || 0) : 0,
      preventaHabilitada: tipoEntrada === 'Compra Online' ? (preventaHabilitada === 'true' || preventaHabilitada === true) : true,
      fechaInicioPreventa: (tipoEntrada === 'Compra Online' && preventaHabilitada === 'false' && fechaInicioPreventa) ? new Date(fechaInicioPreventa) : null
    });

    await nuevoEvento.save();

    // Redireccionar al panel
    res.redirect('/panel');
  } catch (error) {
    console.error('Error guardando evento:', error);
    res.status(500).send('Error interno al crear el evento');
  }
};