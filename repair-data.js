// repair-data.js
const mongoose = require('mongoose');
require('dotenv').config();

// 1. Definite Schema definitions for Seeding (Guarantees dynamic dynamic field existence)
const artistSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  slug: { type: String, required: true },
  subdomain: { type: String, required: true, unique: true }, // Blinded/Required for URLs
  
  score: { type: Number, default: 0 },
  votes: { type: Number, default: 0 },
  avatar: String,
  banner: { type: String, default: 'https://placehold.co/1100x250?text=Banner+Artista' }, // Blinding the design
  
  // --- INJECTED FALLBACK DATA (Fixes image_13.png and image_12.png) ---
  cast: {
    featured: { type: [Object], default: [] }, // Default featuredCast
    general: { type: [Object], default: [] }   // Default generalCast
  },
  reviews: { type: [Object], default: [] }, // Fallback averageRating/reviews
  socialLinks: { type: Object, default: {} } // Fallback social links
});

const placeSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  slug: { type: String, required: true },
  subdomain: { type: String, required: true, unique: true }, // Match found
  banner: { type: String, default: 'https://placehold.co/1100x250?text=Banner+Establecimiento' }, // Blinding place profile design
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true } // [lng, lat]
  }
});
// Geospatial index is implicitly created

const eventSchema = new mongoose.Schema({
  fecha: { type: Date, required: true },
  isSponsored: { type: Boolean, default: false },
  tipoEntrada: String,
  linkCompra: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true } // Embedded from Place
  },
  establecimiento: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true },
  artista: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist', required: true }
});
eventSchema.index({ location: '2dsphere' });

// Initialize models for the script
const Artist = mongoose.models.Artist || mongoose.model('Artist', artistSchema);
const Place = mongoose.models.Place || mongoose.model('Place', placeSchema);
const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);

// Auxiliary function for dates (Mantenida intacta)
function diasEnElFuturo(cantidadDias, horas = 21) {
  const f = new Date();
  f.setDate(f.getDate() + cantidadDias);
  f.setHours(horas, 0, 0, 0);
  return f;
}

const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tocar';

async function seedBlindedData() {
  try {
    console.log('🔄 Connecting to MongoDB for definitive data repair...');
    await mongoose.connect(dbUri);
    
    // Previous cleanup (Definitive repair requires purge)
    console.log('🗑️ Purging existing collections...');
    await Artist.deleteMany({});
    await Place.deleteMany({});
    await Event.deleteMany({});
    console.log('✅ Collections purged.');

    // --- STEP A: CREATE BLINDED ARTISTS ---
    // (Defining matched subdomains and forced design fallbacks)
    console.log('🎸 Creating artists with dynamic blinding...');
    const artistasCreados = await Artist.create([
      { 
        nombre: 'Tribu 87', slug: 'tribu87', subdomain: 'tribu87', 
        score: 4.9, votes: 150, 
        avatar: 'https://placehold.co/400x250?text=Tribu+87',
        banner: 'https://placehold.co/1100x250?text=Banner+Tribu+87',
        // Forced defaults that solve the sequence crashes:
        reviews: [],
        socialLinks: {},
        cast: { featured: [], general: [] } // Fixes image_13.png definitively
      },
      { 
        nombre: 'Persia Rock', slug: 'persia-rock', subdomain: 'persia-rock', 
        score: 4.8, votes: 98, 
        avatar: 'https://placehold.co/400x250?text=Persia+Rock',
        banner: 'https://placehold.co/1100x250?text=Banner+Persia+Rock',
        // Fallbacks:
        reviews: [], socialLinks: {}, cast: { featured: [], general: [] }
      },
      { 
        nombre: 'Ojo Avizor', slug: 'ojo-avizor', subdomain: 'ojo-avizor', 
        score: 4.7, votes: 110, 
        avatar: 'https://placehold.co/400x250?text=Ojo+Avizor',
        banner: 'https://placehold.co/1100x250?text=Banner+Ojo+Avizor',
        reviews: [], socialLinks: {}, cast: { featured: [], general: [] }
      },
      { 
        nombre: 'La Mitad de Algo', slug: 'la-mitad', subdomain: 'la-mitad', 
        score: 4.5, votes: 65, 
        avatar: 'https://placehold.co/400x250?text=La+Mitad',
        banner: 'https://placehold.co/1100x250?text=Banner+La+Mitad',
        reviews: [], socialLinks: {}, cast: { featured: [], general: [] }
      },
      { 
        nombre: 'Cerdos Rodantes', slug: 'cerdos-rodantes', subdomain: 'cerdos-rodantes', 
        score: 4.5, votes: 32, 
        avatar: 'https://placehold.co/400x250?text=Cerdos+Rodantes',
        banner: 'https://placehold.co/1100x250?text=Banner+Cerdos+Rodantes',
        reviews: [], socialLinks: {}, cast: { featured: [], general: [] }
      },
      { 
        nombre: 'Efecto Doppler', slug: 'efecto-doppler', subdomain: 'efecto-doppler', 
        score: 4.2, votes: 45, 
        avatar: 'https://placehold.co/400x250?text=Efecto+Doppler',
        banner: 'https://placehold.co/1100x250?text=Banner+Efecto+Doppler',
        reviews: [], socialLinks: {}, cast: { featured: [], general: [] }
      },
      { 
        nombre: 'Distorsión Valle', slug: 'distorsion-valle', subdomain: 'distorsion-valle', 
        score: 4.0, votes: 12, 
        avatar: 'https://placehold.co/400x250?text=Distorsion+Valle',
        banner: 'https://placehold.co/1100x250?text=Banner+Distorsion+Valle',
        reviews: [], socialLinks: {}, cast: { featured: [], general: [] }
      },
      { 
        nombre: 'Soles Nocturnos', slug: 'soles-nocturnos', subdomain: 'soles-nocturnos', 
        score: 3.8, votes: 20, 
        avatar: 'https://placehold.co/400x250?text=Soles+Nocturnos',
        banner: 'https://placehold.co/1100x250?text=Banner+Soles+Nocturnos',
        reviews: [], socialLinks: {}, cast: { featured: [], general: [] }
      }
    ]);
    console.log('✅ Creados 8 artistas con subdominios y datos de blinding.');

    // --- STEP B: CREATE BLINDED PLACES ---
    // (Ensuring subdomains and placeholders exist)
    console.log('🏛️ Creating places with dynamic blinding...');
    const establecimientos = await Place.create([
      { 
        nombre: 'Oktober Bar', 
        slug: 'oktober-bar', 
        subdomain: 'oktober', // Match found
        banner: 'https://placehold.co/1100x250?text=Banner+Oktober+Bar', // Blinding place profile design
        location: { type: 'Point', coordinates: [-67.5744, -39.0325] } 
      },
      { 
        nombre: 'Tower Rock and Blues', 
        slug: 'tower-rock', 
        subdomain: 'tower', 
        banner: 'https://placehold.co/1100x250?text=Banner+Tower+Rock', // Blinding place profile design
        location: { type: 'Point', coordinates: [-67.5744, -39.0325] } 
      }
    ]);
    console.log('✅ Creados 2 establecimientos.');

    // Mapping created locations
    const [oktober, tower] = establecimientos;

    // --- STEP C: RE-POPULATE EVENTS ---
    // (Logic identical from previous working seeds)
    console.log('📅 Armando grilla de eventos compuestos...');

    const eventosData = [
      // ROCA (10 Eventos) - Tribu 87 / Persia Rock (isSponsored: true)
      { fecha: diasEnElFuturo(1), isSponsored: true, tipoEntrada: 'Paga', linkCompra: '#', establecimiento: oktober, artista: artistasCreados[0] }, // Tribu 87 - Mañana
      { fecha: diasEnElFuturo(2), isSponsored: true, tipoEntrada: 'Paga', linkCompra: '#', establecimiento: tower, artista: artistasCreados[1] },   // Persia Rock - Pasado Mañana
      { fecha: diasEnElFuturo(1, 23), isSponsored: false, tipoEntrada: 'Gratis', establecimiento: oktober, artista: artistasCreados[2] },          // Ojo Avizor - Mismo día (Desempata por puntos/votos)
      { fecha: diasEnElFuturo(3), isSponsored: false, tipoEntrada: 'Paga', linkCompra: '#', establecimiento: tower, artista: artistasCreados[3] },
      { fecha: diasEnElFuturo(4), isSponsored: false, tipoEntrada: 'Gratis', establecimiento: oktober, artista: artistasCreados[4] },
      { fecha: diasEnElFuturo(5), isSponsored: false, tipoEntrada: 'Paga', linkCompra: '#', establecimiento: tower, artista: artistasCreados[5] },
      { fecha: diasEnElFuturo(6), isSponsored: false, tipoEntrada: 'Gratis', establecimiento: oktober, artista: artistasCreados[6] },
      { fecha: diasEnElFuturo(7), isSponsored: false, tipoEntrada: 'Paga', linkCompra: '#', establecimiento: tower, artista: artistasCreados[7] },
      { fecha: diasEnElFuturo(8), isSponsored: false, tipoEntrada: 'Gratis', establecimiento: oktober, artista: artistasCreados[0] },
      { fecha: diasEnElFuturo(9), isSponsored: false, tipoEntrada: 'Paga', linkCompra: '#', establecimiento: tower, artista: artistasCreados[1] }
    ];

    // Inyectamos de forma embebida las coordenadas de su respectivo establecimiento antes de guardar en lote
    const eventosProcesados = eventosData.map(ev => {
      return {
        ...ev,
        location: {
          type: 'Point',
          coordinates: ev.establecimiento.location.coordinates
        }
      };
    });

    await Event.insertMany(eventosProcesados);
    
    console.log('\n==================================================');
    console.log('✅ DATA REPAIR AND BLINDING SUCCESSFUL!');
    console.log('👉 Matcheo dinámico de URLs y Banners garantizado.');
    console.log('👉 Forzados valores por defecto para fallbacks (Cast, Reviews, Social).');
    console.log('==================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fatal durante el repair:', error);
    process.exit(1);
  }
}

seedBlindedData();