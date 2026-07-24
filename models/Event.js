const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  codigoUrl: { type: String, required: true, unique: true },
  
  creatorUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  creatorRole: { type: String, enum: ['Artista', 'Establecimiento'], required: true },

  estadoGeneral: { 
    type: String, 
    enum: ['Pendiente', 'Publicado', 'Cancelado'], 
    default: 'Pendiente' 
  },

  fechaInicio: { type: Date, required: true },

  artistas: [{
    artistaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist' },
    orden: { type: Number, default: 0 },
    estadoInvitacion: { 
      type: String, 
      enum: ['Aceptado', 'Pendiente', 'Rechazado'], 
      default: 'Pendiente' 
    }
  }],

  establecimiento: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', default: null },
  estadoInvitacionLugar: { 
    type: String, 
    enum: ['Aceptado', 'Pendiente', 'Rechazado', 'NoAplica'], 
    default: 'Pendiente' 
  },

  direccionManual: { type: String, default: null },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },

  tipoEntrada: { 
    type: String, 
    enum: ['Entrada Gratis', 'Link Externo', 'Compra Online'], 
    required: true 
  },
  linkExterno: { type: String, default: null },
  precioEntrada: { type: Number, default: 0 },
  preventaHabilitada: { type: Boolean, default: true },
  fechaInicioPreventa: { type: Date, default: null },

  createdAt: { type: Date, default: Date.now }
});

eventSchema.index({ location: '2dsphere' });

module.exports = mongoose.models.Event || mongoose.model('Event', eventSchema);