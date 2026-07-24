const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Artist = require('./models/Artist');
const Place = require('./models/Place');

const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tocar';

async function seedUsuariosTest() {
  try {
    await mongoose.connect(dbUri);
    console.log('🔄 Conectado a MongoDB...');

    await User.deleteMany({});

    let unArtista = await Artist.findOne({ subdomain: 'tribu87' });
    if (!unArtista) unArtista = await Artist.findOne();

    let unLugar = await Place.findOne({ subdomain: /^oktober/ });
    if (unLugar) {
      unLugar.subdomain = 'oktoberbar';
      await unLugar.save();
    } else {
      unLugar = await Place.findOne();
    }

    const usuariosPrueba = [
      new User({
        uid: 'test_artista_123',
        provider: 'local',
        nombre: 'Mauro (Tribu 87)',
        email: 'artista@toc.ar',
        password: '123456',
        avatar: 'https://placehold.co/150x150?text=Usuario+Artista',
        role: 'Artista',
        artistProfile: unArtista ? unArtista._id : null
      }),
      new User({
        uid: 'test_place_456',
        provider: 'local',
        nombre: 'Admin Oktober Bar',
        email: 'oktober@toc.ar',
        password: '123456',
        avatar: 'https://placehold.co/150x150?text=Usuario+Place',
        role: 'Establecimiento',
        placeProfile: unLugar ? unLugar._id : null
      }),
      new User({
        uid: 'test_espectador_789',
        provider: 'local',
        nombre: 'Juan Espectador',
        email: 'espectador@toc.ar',
        password: '123456',
        avatar: 'https://placehold.co/150x150?text=Usuario+Comun',
        role: 'Espectador',
        preferenciasEspectaculos: ['Banda de Covers / Tributo', 'Stand Up Comedy / Monólogos'],
        artistasSeguidos: unArtista ? [unArtista._id] : [],
        establecimientosSeguidos: unLugar ? [unLugar._id] : []
      })
    ];

    for (let u of usuariosPrueba) {
      await u.save();
    }

    console.log('✅ Base de datos sincronizada correctamente.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creando usuarios:', err);
    process.exit(1);
  }
}

seedUsuariosTest();