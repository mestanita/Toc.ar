const Artist = require('../models/Artist');
const Place = require('../models/Place');
const Event = require('../models/Event');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

function construirUrlSubdominio(req, subdominioAlfanumerico) {
  const hostOriginal = req.headers.host || ''; 
  const protocolo = req.protocol;
  const [hostSinPuerto, puerto] = hostOriginal.split(':');
  const sufijoPuerto = puerto ? `:${puerto}` : '';
  const partesDomain = hostSinPuerto.split('.'); 

  if (hostSinPuerto.includes('ngrok-free.dev')) {
    if (partesDomain.length > 3) partesDomain.shift();
    return `http://${subdominioAlfanumerico}.${partesDomain.join('.')}${sufijoPuerto}`;
  }

  if (hostSinPuerto.includes('localhost')) {
    if (partesDomain.length >= 2 && partesDomain[0] !== 'localhost') {
      partesDomain.shift(); 
    }
    return `${protocolo}://${subdominioAlfanumerico}.${partesDomain.join('.')}${sufijoPuerto}`;
  }

  if (partesDomain.length >= 3) {
    partesDomain.shift();
  }

  return `${protocolo}://${subdominioAlfanumerico}.${partesDomain.join('.')}${sufijoPuerto}`;
}

function construirUrlDominioPrincipal(req) {
  const hostOriginal = req.headers.host || ''; 
  const protocolo = req.protocol;
  const [hostSinPuerto, puerto] = hostOriginal.split(':');
  const sufijoPuerto = puerto ? `:${puerto}` : '';
  const partesDomain = hostSinPuerto.split('.'); 

  if (hostSinPuerto.includes('localhost')) {
    return `${protocolo}://localhost${sufijoPuerto}`;
  }

  if (partesDomain.length >= 3) {
    partesDomain.shift();
  }

  return `${protocolo}://${partesDomain.join('.')}${sufijoPuerto}`;
}

exports.renderPanel = async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return res.redirect('/auth/login');

    const subdominioActual = req.subdominioActual || null;

    // 1. CASO ARTISTA
    if (currentUser.role === 'Artista' && currentUser.artistProfile) {
      const artist = await Artist.findById(currentUser.artistProfile)
        .populate('siguiendoEstablecimientos')
        .populate('siguiendoArtistas');

      if (!artist) return res.status(404).send('Perfil de artista no encontrado.');

      if (subdominioActual !== artist.subdomain) {
        const targetUrl = construirUrlSubdominio(req, artist.subdomain) + '/panel';
        return res.redirect(targetUrl);
      }

      const misEventos = await Event.find({ 'artistas.artistaId': artist._id }).populate('establecimiento');
      const invitaciones = await Event.find({ 
        'artistas.artistaId': artist._id,
        'artistas.estadoInvitacion': 'Pendiente',
        creatorUser: { $ne: currentUser._id }
      }).populate('establecimiento');

      const todosLosEstablecimientos = await Place.find().select('nombre subdomain');
      const todosLosArtistas = await Artist.find({ _id: { $ne: artist._id } }).select('nombre subdomain');

      return res.render('artist-panel', {
        currentUser,
        artist,
        misEventos,
        invitaciones,
        todosLosEstablecimientos,
        todosLosArtistas
      });
    }

    // 2. CASO ESTABLECIMIENTO
    if (currentUser.role === 'Establecimiento' && currentUser.placeProfile) {
      const place = await Place.findById(currentUser.placeProfile)
        .populate('siguiendoArtistas');

      if (!place) return res.status(404).send('Perfil de establecimiento no encontrado.');

      if (subdominioActual !== place.subdomain) {
        const targetUrl = construirUrlSubdominio(req, place.subdomain) + '/panel';
        return res.redirect(targetUrl);
      }

      const misEventos = await Event.find({ establecimiento: place._id }).populate('artistas.artistaId');
      const todosLosArtistas = await Artist.find().select('nombre subdomain');

      return res.render('place-panel', {
        currentUser,
        place,
        misEventos,
        todosLosArtistas
      });
    }

    // 3. CASO ESPECTADOR
    if (subdominioActual !== null) {
      const targetUrl = construirUrlDominioPrincipal(req) + '/panel';
      return res.redirect(targetUrl);
    }

    const espectador = await User.findById(currentUser._id)
      .populate('artistasSeguidos')
      .populate('establecimientosSeguidos');

    const misEntradas = await Event.find({ 'listaAsistencia.espectadorId': espectador._id })
      .populate('artistas.artistaId')
      .populate('establecimiento');

    return res.render('user-panel', {
      currentUser: espectador,
      misEntradas
    });

  } catch (error) {
    console.error('❌ Error renderizando el panel:', error);
    res.status(500).send('Error interno cargando el panel de control.');
  }
};

exports.updateArtistProfile = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'Artista' || !user.artistProfile) {
      return res.status(403).send('No autorizado.');
    }

    const { 
      nombre, reseña, categoria, subcategoria, 
      instagram, facebook, whatsapp, email,
      paletaColoresId, tipoLetra, logoCroppedData, bannerCroppedData 
    } = req.body;

    const updateFields = {
      nombre,
      reseña,
      categoria,
      subcategoria,
      'redesSociales.instagram': instagram || '',
      'redesSociales.facebook': facebook || '',
      'redesSociales.whatsapp': whatsapp || '',
      'redesSociales.email': email || '',
      'personalizacion.paletaColoresId': paletaColoresId || 'paleta_1',
      'personalizacion.tipoLetra': tipoLetra || 'Roboto'
    };

    // 1. Guardar Logo Recortado
    if (logoCroppedData && logoCroppedData.startsWith('data:image')) {
      const base64Data = logoCroppedData.replace(/^data:image\/\w+;base64,/, '');
      const fileName = `logo_${Date.now()}_${Math.round(Math.random() * 1000)}.png`;
      const filePath = path.join(__dirname, '../public/uploads', fileName);
      
      fs.writeFileSync(filePath, base64Data, 'base64');
      updateFields.avatar = `/uploads/${fileName}`;
      updateFields.logo = `/uploads/${fileName}`;
    }

    // 2. Guardar Banner Recortado (3:1)
    if (bannerCroppedData && bannerCroppedData.startsWith('data:image')) {
      const base64Data = bannerCroppedData.replace(/^data:image\/\w+;base64,/, '');
      const fileName = `banner_${Date.now()}_${Math.round(Math.random() * 1000)}.jpg`;
      const filePath = path.join(__dirname, '../public/uploads', fileName);
      
      fs.writeFileSync(filePath, base64Data, 'base64');
      updateFields.banner = `/uploads/${fileName}`;
    }

    await Artist.findByIdAndUpdate(user.artistProfile, { $set: updateFields }, { new: true });

    res.redirect('/panel');
  } catch (err) {
    console.error('Error actualizando perfil artista:', err);
    res.status(500).send('Error al guardar datos.');
  }
};

exports.updatePlaceProfile = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'Establecimiento' || !user.placeProfile) {
      return res.status(403).send('No autorizado.');
    }

    const { 
      nombre, diasHorarios, direccionTexto, placeLat, placeLng,
      tipoMacro, subcategoria, tipoEspecifico,
      espectadoresMin, espectadoresMax, asientosNumerados, reservaMesas, estacionamientoPropio,
      escenario, sonido, iluminacion, backline, ventaComida, ventaBebidas,
      instagram, facebook, tikTok, youtube, soundCloud, bandcamp, email, whatsapp
    } = req.body;

    const updateData = {
      nombre,
      diasHorarios,
      direccionTexto,
      tipoMacro,
      subcategoria,
      tipoEspecifico,
      'capacidad.espectadoresMin': parseInt(espectadoresMin) || 0,
      'capacidad.espectadoresMax': parseInt(espectadoresMax) || 0,
      'capacidad.asientosNumerados': asientosNumerados === 'true' || asientosNumerados === true,
      'capacidad.reservaMesas': reservaMesas === 'true' || reservaMesas === true,
      'capacidad.estacionamientoPropio': estacionamientoPropio || 'NO',

      'infraestructuraTecnica.escenario': escenario || 'NO',
      'infraestructuraTecnica.sonido': sonido || 'NO',
      'infraestructuraTecnica.iluminacion': iluminacion || 'NO',
      'infraestructuraTecnica.backline': backline || 'NO',
      'infraestructuraTecnica.ventaComida': ventaComida || 'NO',
      'infraestructuraTecnica.ventaBebidas': ventaBebidas || 'NO',

      'redesSociales.instagram': instagram || '',
      'redesSociales.facebook': facebook || '',
      'redesSociales.tikTok': tikTok || '',
      'redesSociales.youtube': youtube || '',
      'redesSociales.soundCloud': soundCloud || '',
      'redesSociales.bandcamp': bandcamp || '',
      'redesSociales.email': email || '',
      'redesSociales.whatsapp': whatsapp || ''
    };

    if (placeLat && placeLng) {
      updateData.location = {
        type: 'Point',
        coordinates: [parseFloat(placeLng), parseFloat(placeLat)]
      };
    }

    await Place.findByIdAndUpdate(user.placeProfile, updateData);

    res.redirect('/panel');
  } catch (err) {
    console.error('Error actualizando perfil de establecimiento:', err);
    res.status(500).send('Error al guardar datos.');
  }
};

exports.respondEventInvite = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { estado } = req.body; // 'Aceptado' o 'Rechazado'

    const evento = await Event.findById(id);
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });

    // Si es Artista invitado
    if (user.artistProfile) {
      const invitadoObj = evento.artistas.find(a => a.artistaId && a.artistaId.toString() === user.artistProfile.toString());
      if (invitadoObj) {
        invitadoObj.estadoInvitacion = estado;
      }
    }

    // Si es Establecimiento invitado
    if (user.placeProfile && evento.establecimiento && evento.establecimiento.toString() === user.placeProfile.toString()) {
      evento.estadoInvitacionLugar = estado;
    }

    // Si se aceptaron todas las partes, pasa a 'Publicado'
    const hayArtistasPendientes = evento.artistas.some(a => a.estadoInvitacion === 'Pendiente');
    const hayLugarPendiente = (evento.estadoInvitacionLugar === 'Pendiente');

    if (!hayArtistasPendientes && !hayLugarPendiente && evento.estadoGeneral !== 'Cancelado') {
      evento.estadoGeneral = 'Publicado';
    }

    await evento.save();
    res.json({ ok: true, estadoGeneral: evento.estadoGeneral });
  } catch (err) {
    console.error('Error respondiendo invitación:', err);
    res.status(500).json({ error: 'Error interno al procesar respuesta' });
  }
};

// 2. Cancelar Evento (Acción exclusiva del Creador)
exports.cancelEventByCreator = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const evento = await Event.findById(id);
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });

    if (evento.creatorUser.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'No tienes permisos para cancelar este evento.' });
    }

    evento.estadoGeneral = 'Cancelado';
    await evento.save();

    // Notificación automática a todos los invitados
    for (let artObj of evento.artistas) {
      if (artObj.artistaId && artObj.artistaId.toString() !== user.artistProfile?.toString()) {
        const userInvitado = await User.findOne({ artistProfile: artObj.artistaId });
        if (userInvitado) {
          userInvitado.mensajes = userInvitado.mensajes || [];
          userInvitado.mensajes.push({
            remitenteNombre: user.nombre,
            asunto: '❌ Evento Cancelado',
            contenido: `El evento "${evento.nombre}" ha sido cancelado por su creador.`,
            fecha: new Date()
          });
          await userInvitado.save();
        }
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Error cancelando evento:', err);
    res.status(500).json({ error: 'Error al cancelar el evento' });
  }
};

// 3. Remover/Descartar Evento Cancelado (Limpieza de lista del invitado)
exports.dismissCancelledEvent = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const evento = await Event.findById(id);
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });

    if (user.artistProfile) {
      evento.artistas = evento.artistas.filter(a => a.artistaId && a.artistaId.toString() !== user.artistProfile.toString());
    }

    if (user.placeProfile && evento.establecimiento && evento.establecimiento.toString() === user.placeProfile.toString()) {
      evento.establecimiento = null;
      evento.estadoInvitacionLugar = 'NoAplica';
    }

    await evento.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('Error descartando evento cancelado:', err);
    res.status(500).json({ error: 'Error al descartar el evento' });
  }
};