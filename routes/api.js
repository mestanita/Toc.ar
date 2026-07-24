const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { calcularDistanciaKm } = require('../services/geoService');
const { enriquecerEvento } = require('../services/eventService');

/**
 * @route GET /api/events-featured
 * @desc Obtiene eventos destacados para el banner principal
 * @query {number} lat - Latitud del usuario
 * @query {number} lng - Longitud del usuario
 * @query {number} radiusKm - Radio de búsqueda en kilómetros
 */
router.get('/events-featured', async (req, res) => {
  try {
    const userLat = parseFloat(req.query.lat);
    const userLng = parseFloat(req.query.lng);
    const radiusKm = parseFloat(req.query.radiusKm) || 15;

    let todosLosEventos = await Event.find({ fechaInicio: { $gte: new Date() } })
      .populate('artistas.artistaId')
      .populate('establecimiento')
      .lean();

    // Enriquecer eventos con distancia e información adicional
    const eventosEnriquecidos = await Promise.all(
      todosLosEventos.map(ev => enriquecerEvento(ev, req, userLat, userLng))
    );

    // Filtrar destacados (sponsored o mejores por score)
    let destacadosFinal = eventosEnriquecidos.filter(ev => 
      ev.isSponsored && ev.pujaMonto >= 1000 && ev.distancia <= radiusKm
    );
    destacadosFinal.sort((a, b) => b.pujaMonto - a.pujaMonto || a.distancia - b.distancia);

    // Completar con eventos de la zona si no hay suficientes destacados
    if (destacadosFinal.length < 5) {
      const mejoresZona = eventosEnriquecidos
        .filter(ev => !ev.isSponsored && ev.distancia <= radiusKm)
        .sort((a, b) => (b.artista?.score || 0) - (a.artista?.score || 0) || 
                        (b.artista?.votes || 0) - (a.artista?.votes || 0));
      
      for (let ev of mejoresZona) {
        if (destacadosFinal.length >= 5) break;
        if (!destacadosFinal.some(d => d._id.toString() === ev._id.toString())) {
          destacadosFinal.push(ev);
        }
      }
    }

    // Completar con eventos globales si aún faltan
    if (destacadosFinal.length < 5) {
      const remanentesGlobales = eventosEnriquecidos
        .sort((a, b) => a.distancia - b.distancia || 
                        (b.artista?.score || 0) - (a.artista?.score || 0));
      
      for (let ev of remanentesGlobales) {
        if (destacadosFinal.length >= 5) break;
        if (!destacadosFinal.some(d => d._id.toString() === ev._id.toString())) {
          destacadosFinal.push(ev);
        }
      }
    }

    res.json(destacadosFinal.slice(0, 5));
  } catch (error) {
    console.error("❌ Error en API events-featured:", error);
    res.status(500).json({ error: "Error interno al calcular destacados" });
  }
});

/**
 * @route GET /api/events-nearby
 * @desc Obtiene eventos cercanos para la grilla principal
 * @query {number} lat - Latitud del usuario
 * @query {number} lng - Longitud del usuario
 * @query {string} searchName - Nombre del lugar a buscar
 * @query {number} page - Número de página para paginación
 */
router.get('/events-nearby', async (req, res) => {
  try {
    const userLat = parseFloat(req.query.lat);
    const userLng = parseFloat(req.query.lng);
    const searchName = req.query.searchName ? req.query.searchName.trim() : null;
    
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    let query = { fechaInicio: { $gte: new Date() } };

    // Búsqueda por nombre de lugar
    if (searchName) {
      const Place = require('../models/Place');
      const lugarEncontrado = await Place.findOne({ 
        nombre: { $regex: searchName, $options: 'i' } 
      });
      
      if (lugarEncontrado) {
        query.establecimiento = lugarEncontrado._id;
      } else {
        return res.json([]);
      }
    }

    let eventos = await Event.find(query)
      .populate('artistas.artistaId')
      .populate('establecimiento')
      .lean();

    // Enriquecer eventos con relevancia personal
    const currentUser = req.user;
    const eventosEnriquecidos = await Promise.all(
      eventos.map(ev => enriquecerEvento(ev, req, userLat, userLng, currentUser))
    );

    // Ordenar por relevancia, distancia y fecha
    eventosEnriquecidos.sort((a, b) => 
      b.relevanciaPersonal - a.relevanciaPersonal || 
      a.distancia - b.distancia || 
      new Date(a.fechaInicio) - new Date(b.fechaInicio)
    );

    const resultadosPaginados = eventosEnriquecidos.slice(skip, skip + limit);
    res.json(resultadosPaginados);
  } catch (error) {
    console.error("❌ Error en API events-nearby:", error);
    res.status(500).json({ error: "Error interno de base de datos en la grilla principal" });
  }
});

module.exports = router;
