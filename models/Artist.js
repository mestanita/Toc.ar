const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  subdomain: { type: String, required: true, unique: true },
  avatar: { type: String, default: 'https://placehold.co/400x250?text=Logo+Artista' },
  banner: { type: String, default: 'https://placehold.co/1100x250?text=Banner+Artista' },
  reseña: { type: String, required: true },
  
  // Categorización Estricta
  categoria: { 
    type: String, 
    enum: ['Música en Vivo', 'Humor y Artes Escénicas', 'Magia, Ilusionismo y Variedades', 'Danza y Performance', 'Literatura y Oratoria', 'Shows Interactivos y de Entretenimiento', 'Artes Plásticas y visuales'],
    required: true 
  },
  subcategoria: { type: String, required: true }, // Mapeada dinámicamente según la categoría principal
  
  // Preferencias de Espacio y Aforo
  preferenciasEstablecimiento: {
    tiposAptos: [{ type: String, enum: ['Sala', 'Teatro', 'Bar', 'Restaurante', 'Anfiteatros', 'Festivales', 'Sala de exposición'] }],
    requiereAsientosNumerados: { type: Boolean, default: false },
    requiereReservaMesas: { type: Boolean, default: false },
    capacidadMin: { type: Number, default: 0 },
    capacidadMax: { type: Number, default: 999999 },
    estacionamiento: { type: String, enum: ['SI', 'NO', 'Opcional'], default: 'Opcional' }
  },

  // Rider Técnico Obligatorio
  requisitosTecnicos: {
    escenario: { type: String, enum: ['SI', 'NO', 'Opcional'], default: 'Opcional' },
    sonido: { type: String, enum: ['SI', 'NO', 'Opcional'], default: 'Opcional' },
    iluminacion: { type: String, enum: ['SI', 'NO', 'Opcional'], default: 'Opcional' },
    backline: { type: String, enum: ['SI', 'NO', 'Opcional'], default: 'Opcional' },
    ventaComida: { type: String, enum: ['SI', 'NO', 'Opcional'], default: 'Opcional' },
    ventaBebidas: { type: String, enum: ['SI', 'NO', 'Opcional'], default: 'Opcional' }
  },

  // Elenco Completo
  elenco: [{
    nombreApellido: { type: String, required: true },
    funcion: { type: String, required: true },
    fotoPerfil: { type: String, default: null } // Si es null, pasa a la sección "Resto del elenco"
  }],

  // Redes Sociales Homologadas
  redesSociales: {
    instagram: String, facebook: String, tikTok: String, youtube: String,
    soundCloud: String, bandcamp: String, vampr: String, reverbNation: String,
    drooble: String, email: String, whatsapp: String
  },

  // Identidad Visual del Sitio Dinámico
  personalizacion: {
    paletaColoresId: { type: String, default: 'default_dark' }, // Vinculado a estilos preestablecidos
    tipoLetra: { type: String, default: 'Arial' },
    imagenFondo: { type: String, default: null }
  },

  // Métricas del Sistema de Reputación
  score: { type: Number, default: 5.0 },
  votes: { type: Number, default: 0 },
  reviews: [{
    espectadorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comentario: String,
    estrellas: Number,
    fecha: { type: Date, default: Date.now }
  }],

  // Lógica de Red Social: Relaciones
  siguiendoArtistas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artist' }],
  siguiendoEstablecimientos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Place' }]
});

module.exports = mongoose.models.Artist || mongoose.model('Artist', artistSchema);