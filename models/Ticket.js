// models/Ticket.js
const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  qrCode: { type: String, required: true, unique: true },
  checkedIn: { type: Boolean, default: false }, // REGLA: Debe ser 'true' para calificar
  checkInTime: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', TicketSchema);