const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  provider: { type: String, enum: ['google', 'facebook', 'local'], required: true },
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, default: null },
  avatar: { type: String, default: 'https://placehold.co/150x150?text=User' },

  // ROL Y VÍNCULO DE PERFIL
  role: {
    type: String,
    enum: ['Espectador', 'Artista', 'Establecimiento'],
    default: 'Espectador'
  },
  artistProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist', default: null },
  placeProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', default: null },

  // PREFERENCIAS DE BÚSQUEDA Y SEGUIMIENTO
  preferenciasEspectaculos: [{ type: String }],
  artistasSeguidos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artist' }],
  establecimientosSeguidos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Place' }],

  // MENSAJERÍA INTERNA
  mensajes: [{
    remitenteNombre: String,
    asunto: String,
    contenido: String,
    fecha: { type: Date, default: Date.now },
    leido: { type: Boolean, default: false }
  }]
});

// Middleware Pre-Save: Encriptar contraseña antes de guardar en BD
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Método para verificar la contraseña ingresada en el Login
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
