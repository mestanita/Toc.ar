const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist', required: true },
  title: { type: String, required: true },
  date: { type: Date, required: true },
  venue: { type: String, required: true }, // Ej: "La Trastienda Club"
  locationUrl: { type: String },           // Enlace de Google Maps
  imageUrl: { type: String },              // Flyer promocional
  
  // Modalidad de acceso seleccionada por el artista
  modality: { 
    type: String, 
    enum: ['Comprar aquí', 'Comprar en', 'Entrada gratis'], 
    required: true 
  },
  externalTicketUrl: { type: String }, // Se completa si elige 'Comprar en' (ej: Plateanet, Livepass)
  price: { type: Number, default: 0 },
  ticketsAvailable: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);