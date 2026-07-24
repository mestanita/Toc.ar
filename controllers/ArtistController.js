const Event = require('../models/Event');
const Review = require('../models/Review');

exports.renderProfile = async (req, res) => {
  try {
    const artist = req.artist; 
    const currentUser = req.user || null; // Enviamos el usuario logueado de la sesión de manera segura
    
    // Si NO hay subdominio de artista activo, renderizamos la Landing Page global
    if (!artist) {
      const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "TU_API_KEY";
      return res.render('landing', { 
        title: '¿Quién va a tocar? | toc.ar',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        currentUser
      });
    }

    // --- CARGA DEL PERFIL PÚBLICO DEL ARTISTA (Ej: tribu87) ---
    const featuredCast = artist.cast.filter(member => member.photo && member.photo.trim() !== '');
    const generalCast = artist.cast.filter(member => !member.photo || member.photo.trim() === '');
    
    // Traemos los eventos asociados al artista ordenados por fecha ascendente
    const events = await Event.find({ artistId: artist._id }).sort({ date: 1 });
    
    const now = new Date();
    const upcomingEvents = events.filter(e => e.date >= now);
    const pastEvents = events.filter(e => e.date < now);

    // Traemos las valoraciones y promediamos
    const reviews = await Review.find({ artistId: artist._id }).sort({ createdAt: -1 });
    const averageRating = reviews.length > 0 
      ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
      : 0;

    // Renderizamos el perfil del artista inyectando los datos y el estado de la sesión
    res.render('artist-profile', {
      artist,
      featuredCast,
      generalCast,
      upcomingEvents,
      pastEvents,
      reviews,
      averageRating,
      currentUser
    });

  } catch (error) {
    console.error('Error al renderizar la vista pública:', error);
    res.status(500).send('Error interno del servidor');
  }
};