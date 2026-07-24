const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  subdomain: { type: String, required: true, unique: true },
  logo: { type: String, default: 'https://placehold.co/400x250?text=Logo+Establecimiento' },
  banner: { type: String, default: 'https://placehold.co/1100x250?text=Banner+Establecimiento' },
  
  // Dirección en texto para la UI + Indexación Geoespacial Obligatoria
  direccionTexto: { type: String, default: '' },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitud, latitud]
  },
  
  diasHorarios: { type: String, required: true }, // Ej: "Lun a Dom 18:00 a 03:00"

  // Clasificación Estricta del Espacio
// Clasificación Estricta del Espacio (3 Niveles)
  tipoMacro: { 
    type: String, 
    enum: [
      'Gastronomía, Ocio y Vida Nocturna', 
      'Espacios Culturales y de Artes Escénicas', 
      'Salones y Espacios de Eventos', 
      'Recintos Deportivos y de Grandes Convocatorias', 
      'Espacios Públicos y Alternativos'
    ], 
    required: true 
  },
  subcategoria: { type: String, default: '' }, // Level 2 (ej: "Bar / Pub", "Teatros y Auditorios")
  tipoEspecifico: { type: String, required: true }, // Level 3 (ej: "Bar de Música en Vivo (Live Music Bar)")

  // Capacidades Físicas Reales
  capacidad: {
    asientosNumerados: { type: Boolean, default: false },
    reservaMesas: { type: Boolean, default: false },
    espectadoresMin: { type: Number, default: 0 },
    espectadoresMax: { type: Number, required: true },
    estacionamientoPropio: { type: String, enum: ['SI', 'NO', 'Opcional'], default: 'NO' }
  },

  // Infraestructura Instalada de Fábrica
  infraestructuraTecnica: {
    escenario: { type: String, enum: ['SI', 'NO', 'Opcional'], default: 'NO' },
    sonido: { type: String, enum: ['SI', 'NO', 'Opcional'], default: 'NO' },
    iluminacion: { type: String, enum: ['SI', 'NO', 'Opcional'], default: 'NO' },
    backline: { type: String, enum: ['SI', 'NO', 'Opcional'], default: 'NO' },
    ventaComida: { type: String, enum: ['SI', 'NO', 'Opcional'], default: 'NO' },
    ventaBebidas: { type: String, enum: ['SI', 'NO', 'Opcional'], default: 'NO' }
  },

  tiposArtistasAptos: [{ type: String }], // Ej: ["Teatro", "Banda en vivo", "Standup"]

  // Redes Sociales Completas
  redesSociales: {
    instagram: String, facebook: String, tikTok: String, youtube: String,
    soundCloud: String, bandcamp: String, vampr: String, reverbNation: String,
    drooble: String, email: String, whatsapp: String
  },

  personalizacion: {
    paletaColoresId: { type: String, default: 'default_light' },
    tipoLetra: { type: String, default: 'Arial' },
    imagenFondo: { type: String, default: null }
  },

  // Reputación del Establecimiento
  score: { type: Number, default: 5.0 },
  votes: { type: Number, default: 0 },
  reviews: [{
    espectadorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comentario: String,
    estrellas: Number,
    fecha: { type: Date, default: Date.now }
  }],

  // Lógica de Red Social: Seguidores / Vinculaciones
  seguidoresArtistas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artist' }],
  siguiendoArtistas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artist' }]
});

placeSchema.index({ location: '2dsphere' });

module.exports = mongoose.models.Place || mongoose.model('Place', placeSchema);