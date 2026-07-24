const Artist = require('../models/Artist');
const Place = require('../models/Place'); // 👈 Importamos el modelo de Establecimientos

module.exports = async (req, res, next) => {
  // Limpiamos el host para quitarle el puerto si existiera (ej: "quienva.toc.ar:3000" -> "quienva.toc.ar")
  const host = (req.headers.host || '').split(':')[0];
  const parts = host.split('.');
  
  let subdomain = null;

  // 1. Detección en entorno de producción o simulación local (ej: tribu87.toc.ar -> 3 partes)
  if (parts.length > 2) {
    subdomain = parts[0].toLowerCase();
  } 
  // 2. Detección en entorno local básico (ej: tribu87.localhost -> 2 partes)
  else if (parts.length === 2 && parts[1] === 'localhost') {
    subdomain = parts[0].toLowerCase();
  }

  // 3. REGLAS DE EXCEPCIÓN: Ignoramos subdominios de sistema y variantes de la landing
  if (
    subdomain === 'www' || 
    subdomain === 'admin' || 
    subdomain === 'api' || 
    subdomain === 'quienva' || 
    subdomain === 'quienvaatocar'
  ) {
    subdomain = null; // Al ser null, Express sabe que debe cargar la landing global de búsqueda
  }

  // Si no hay subdominio de sistema o es la landing, continúa sin intervenir
  if (!subdomain) {
    return next();
  }

  try {
    // Guardamos el subdominio limpio en el request para consumo de app.js si fuera necesario
    req.subdominioActual = subdomain;

    // ============================================================
    // 👉 BÚSQUEDA SECUENCIAL HÍBRIDA 👈
    // ============================================================

    // Primero: Verificamos si pertenece a un Artista
    const artist = await Artist.findOne({ subdomain });
    if (artist) {
      req.artist = artist; // Inyectamos el artista en el request
      return next();
    }

    // Segundo: Si no fue un artista, verificamos si es un Establecimiento
    const place = await Place.findOne({ subdomain });
    if (place) {
      req.place = place; // Inyectamos el establecimiento en el request
      return next();
    }
    
    // Tercero: Si no existe en ninguna de las dos colecciones del ecosistema
    return res.status(404).send('La Fanpage de este artista o establecimiento no existe en toc.ar');

  } catch (error) {
    console.error('❌ Error procesando subdominio en el middleware:', error);
    res.status(500).send('Error interno del servidor');
  }
};