const express = require('express');
const router = express.Router();
const Artist = require('../models/Artist');
const Place = require('../models/Place');
const Event = require('../models/Event');
const { extraerSubdominio } = require('../services/subdomainService');
const { generarTemaArtista, generarTemaEstablecimiento, clasificarElenco } = require('../services/profileService');

/**
 * Middleware para detectar y validar subdominios
 */
const subdomainMiddleware = async (req, res, next) => {
  const host = req.headers.host || '';
  const subdomain = extraerSubdominio(host);
  
  if (!subdomain) {
    return next();
  }

  try {
    req.subdominioActual = subdomain;

    // Búsqueda secuencial: primero Artistas, luego Establecimientos
    const artist = await Artist.findOne({ subdomain });
    if (artist) {
      req.artist = artist;
      return next();
    }

    const place = await Place.findOne({ subdomain });
    if (place) {
      req.place = place;
      return next();
    }
    
    return res.status(404).send('La Fanpage de este artista o establecimiento no existe en toc.ar');
  } catch (error) {
    console.error('❌ Error procesando subdominio en el middleware:', error);
    res.status(500).send('Error interno del servidor');
  }
};

/**
 * @route GET /
 * @desc Despachador principal - Renderiza perfil o landing según subdominio
 */
router.get('/', subdomainMiddleware, async (req, res) => {
  try {
    const subdominioActual = req.subdominioActual;

    if (subdominioActual && req.artist) {
      const artista = req.artist;
      const eventos = await Event.find({ 'artistas.artistaId': artista._id })
        .populate('establecimiento')
        .sort({ fechaInicio: 1 });

      const artistaPlano = JSON.parse(JSON.stringify(artista));
      artistaPlano.theme = generarTemaArtista(artistaPlano);

      const elencoData = clasificarElenco(artistaPlano.elenco);

      return res.render('artist-profile', { 
        artist: artistaPlano, 
        upcomingEvents: eventos,
        averageRating: artista.score || 5.0,
        reviews: artista.reviews || [],
        featuredCast: elencoData.featuredCast,
        generalCast: elencoData.generalCast
      });
    }

    if (subdominioActual && req.place) {
      const lugar = req.place;
      const eventos = await Event.find({ establecimiento: lugar._id })
        .populate('artistas.artistaId')
        .sort({ fechaInicio: 1 });
      
      const lugarPlano = JSON.parse(JSON.stringify(lugar));
      lugarPlano.theme = generarTemaEstablecimiento();

      return res.render('place-profile', {
        lugar: lugarPlano,
        eventos: eventos.map(ev => ({ ...ev, artista: ev.artistas?.[0]?.artistaId || null })),
        reviews: lugarPlano.reviews || [],
        averageRating: lugarPlano.score || 5.0
      });
    }

    // Sin subdominio: landing page principal
    res.render('landing');
  } catch (error) {
    console.error("❌ Error en el despachador raíz de subdominios:", error);
    res.status(500).send("Error interno en el servidor");
  }
});

module.exports = router;
