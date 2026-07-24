const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

// --- 1. IMPORTACIÓN DE MODELOS COMPUESTOS ---
const Event = require('./models/Event');
const Artist = require('./models/Artist');
const Place = require('./models/Place'); 
const User = require('./models/User');

const PanelController = require('./controllers/PanelController');
const EventController = require('./controllers/EventController');

const app = express();
app.enable('trust proxy');

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tocar')
  .then(() => console.log('💾 Conectado exitosamente a MongoDB'))
  .catch(err => console.error('❌ Error al conectar a MongoDB:', err));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- 2. CONFIGURACIÓN DE MULTER Y ALMACENAMIENTO DE ARCHIVOS ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public/uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `artist_${Date.now()}_${Math.round(Math.random() * 1E9)}${ext}`);
  }
});
const upload = multer({ storage });

// Asegurar existencia de la carpeta public/uploads
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)){
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// --- 3. CONFIGURACIÓN DE SESIONES Y COOKIES ---
const isLocalhost = (req) => {
  const host = req.headers.host || '';
  return host.includes('localhost') || host.includes('127.0.0.1') || host.includes('ngrok-free.dev');
};

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'clave_secreta_tocar_alta_valle_encriptada',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax'
  }
});

app.use((req, res, next) => {
  sessionMiddleware(req, res, () => {
    if (!isLocalhost(req)) {
      req.session.cookie.domain = '.toc.ar';
    }
    next();
  });
});

// --- 4. PASSPORT CONFIGURACIÓN Y LOCAL STRATEGY ---
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        console.log(`❌ Login fallido: Usuario no encontrado (${email})`);
        return done(null, false, { message: 'El correo electrónico no está registrado.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        console.log(`❌ Login fallido: Contraseña incorrecta para ${email}`);
        return done(null, false, { message: 'Contraseña incorrecta.' });
      }

      console.log(`✅ Login exitoso: ${user.nombre} (${user.role})`);
      return done(null, user);
    } catch (err) {
      console.error('❌ Error en LocalStrategy:', err);
      return done(err);
    }
  }
));

// Middlewares del ecosistema
const subdomainMiddleware = require('./middlewares/subdomain');

app.use((req, res, next) => {
  res.locals.currentUser = req.user || null;
  next();
});

app.use(subdomainMiddleware);

// Middleware para proteger rutas autenticadas
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect('/auth/login');
};

// --- 5. LÓGICA MATEMÁTICA DE GEOLOCALIZACIÓN Y URLs ---
function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function construirUrlSubdominio(req, subdominioAlfanumerico) {
  const hostOriginal = req.headers.host || ''; 
  const protocolo = req.protocol;
  const [hostSinPuerto, puerto] = hostOriginal.split(':');
  const sufijoPuerto = puerto ? `:${puerto}` : '';
  const partesDomain = hostSinPuerto.split('.'); 

  if (hostSinPuerto.includes('ngrok-free.dev')) {
    if (partesDomain.length > 3) partesDomain.shift();
    return `http://${subdominioAlfanumerico}.${partesDomain.join('.')}${sufijoPuerto}`;
  }

  if (hostSinPuerto.includes('localhost')) {
    if (partesDomain.length >= 2 && partesDomain[0] !== 'localhost') {
      partesDomain.shift(); 
    }
    return `${protocolo}://${subdominioAlfanumerico}.${partesDomain.join('.')}${sufijoPuerto}`;
  }

  if (partesDomain.length >= 3) {
    partesDomain.shift();
  }

  return `${protocolo}://${subdominioAlfanumerico}.${partesDomain.join('.')}${sufijoPuerto}`;
}

// DICCIONARIO COMPLETO DE PALETAS DE COLORES PARA EL PROFILE
const DICCIONARIO_PALETAS = {
  'paleta_1': { bg: '#0f172a', accent: '#e75b37', text: '#ffffff' },
  'paleta_2': { bg: '#120024', accent: '#00ffcc', text: '#ffffff' },
  'paleta_3': { bg: '#1a1a1a', accent: '#f1c40f', text: '#f5f5f5' },
  'paleta_4': { bg: '#1e1b4b', accent: '#818cf8', text: '#e0e7ff' },
  'paleta_5': { bg: '#180808', accent: '#ef4444', text: '#fef2f2' },
  'paleta_6': { bg: '#062c24', accent: '#10b981', text: '#ecfdf5' },
  'paleta_7': { bg: '#2d142c', accent: '#ff6b6b', text: '#fff0f0' },
  'paleta_8': { bg: '#19002e', accent: '#ff007f', text: '#00f0ff' },
  'paleta_9': { bg: '#000000', accent: '#888888', text: '#ffffff' },
  'paleta_10': { bg: '#2b2118', accent: '#d97706', text: '#fef3c7' },
  'paleta_11': { bg: '#0f2b46', accent: '#38bdf8', text: '#f0f9ff' },
  'paleta_12': { bg: '#2e1065', accent: '#a855f7', text: '#faf5ff' },
  'paleta_13': { bg: '#271c19', accent: '#b45309', text: '#fffbeb' },
  'paleta_14': { bg: '#1c1917', accent: '#f97316', text: '#fff7ed' },
  'paleta_15': { bg: '#020617', accent: '#382bf0', text: '#f8fafc' },
  'paleta_16': { bg: '#f8fafc', accent: '#0284c7', text: '#0f172a' },
  'paleta_17': { bg: '#fdf2f8', accent: '#ec4899', text: '#831843' },
  'paleta_18': { bg: '#14532d', accent: '#84cc16', text: '#f7fee7' },
  'paleta_19': { bg: '#18181b', accent: '#ea580c', text: '#fafafa' },
  'paleta_20': { bg: '#09090b', accent: '#eab308', text: '#fefce8' }
};

// ============================================================
// 🔥 6. RUTAS DE LA API
// ============================================================

// API BANNER DESTACADOS
app.get('/api/events-featured', async (req, res) => {
  try {
    const userLat = parseFloat(req.query.lat);
    const userLng = parseFloat(req.query.lng);
    const radiusKm = parseFloat(req.query.radiusKm) || 15;

    let todosLosEventos = await Event.find({ fechaInicio: { $gte: new Date() } })
      .populate('artistas.artistaId')
      .populate('establecimiento')
      .lean();

    todosLosEventos = todosLosEventos.map(ev => {
      const dist = (userLat && userLng && ev.location?.coordinates) 
        ? calcularDistanciaKm(userLat, userLng, ev.location.coordinates[1], ev.location.coordinates[0]) 
        : 0;

      const artistaPrincipal = (ev.artistas && ev.artistas.length > 0 && ev.artistas[0].artistaId) 
        ? ev.artistas[0].artistaId 
        : null;

      const artistaFallback = artistaPrincipal || {
        nombre: ev.establecimiento?.nombre || 'Evento toc.ar',
        avatar: 'https://placehold.co/150x150?text=toc.ar',
        score: 5.0,
        votes: 0,
        subdomain: '#'
      };

      return { 
        ...ev, 
        distancia: dist,
        artista: artistaFallback, 
        urlArtista: artistaPrincipal ? construirUrlSubdominio(req, artistaPrincipal.subdomain) : '#',
        urlEstablecimiento: ev.establecimiento ? construirUrlSubdominio(req, ev.establecimiento.subdomain) : null
      };
    });

    let destacadosFinal = todosLosEventos.filter(ev => ev.isSponsored && ev.pujaMonto >= 1000 && ev.distancia <= radiusKm);
    destacadosFinal.sort((a, b) => b.pujaMonto - a.pujaMonto || a.distancia - b.distancia);

    if (destacadosFinal.length < 5) {
      const mejoresZona = todosLosEventos
        .filter(ev => !ev.isSponsored && ev.distancia <= radiusKm)
        .sort((a, b) => (b.artista?.score || 0) - (a.artista?.score || 0) || (b.artista?.votes || 0) - (a.artista?.votes || 0));
      
      for (let ev of mejoresZona) {
        if (destacadosFinal.length >= 5) break;
        if (!destacadosFinal.some(d => d._id.toString() === ev._id.toString())) {
          destacadosFinal.push(ev);
        }
      }
    }

    if (destacadosFinal.length < 5) {
      const remanentesGlobales = todosLosEventos
        .sort((a, b) => a.distancia - b.distancia || (b.artista?.score || 0) - (a.artista?.score || 0));
      
      for (let ev of remanentesGlobales) {
        if (destacadosFinal.length >= 5) break;
        if (!destacadosFinal.some(d => d._id.toString() === ev._id.toString())) {
          destacadosFinal.push(ev);
        }
      }
    }

    res.json(destacadosFinal.slice(0, 5));
  } catch (error) {
    console.error("❌ Error en API events-featured:", error);
    res.status(500).json({ error: "Error interno al calcular destacados" });
  }
});

// API GRILLA PRINCIPAL
app.get('/api/events-nearby', async (req, res) => {
  try {
    const userLat = parseFloat(req.query.lat);
    const userLng = parseFloat(req.query.lng);
    const searchName = req.query.searchName ? req.query.searchName.trim() : null;
    
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    let query = { fechaInicio: { $gte: new Date() } };

    if (searchName) {
      const lugarEncontrado = await Place.findOne({ nombre: { $regex: searchName, $options: 'i' } });
      if (lugarEncontrado) {
        query.establecimiento = lugarEncontrado._id;
      } else {
        return res.json([]); 
      }
    }

    let eventos = await Event.find(query)
      .populate('artistas.artistaId')
      .populate('establecimiento')
      .lean();

    const currentUser = req.user;
    const artistasSeguidosIds = currentUser?.artistasSeguidos?.map(id => id.toString()) || [];
    const lugaresSeguidosIds = currentUser?.establecimientosSeguidos?.map(id => id.toString()) || [];
    const misPreferencias = currentUser?.preferenciasEspectaculos || [];

    eventos = eventos.map(ev => {
      const dist = (userLat && userLng && ev.location?.coordinates) 
        ? calcularDistanciaKm(userLat, userLng, ev.location.coordinates[1], ev.location.coordinates[0]) 
        : 0;

      const artistaPrincipal = (ev.artistas && ev.artistas.length > 0 && ev.artistas[0].artistaId) 
        ? ev.artistas[0].artistaId 
        : null;

      const artistaFallback = artistaPrincipal || {
        nombre: ev.establecimiento?.nombre || 'Evento toc.ar',
        avatar: 'https://placehold.co/150x150?text=toc.ar',
        score: 5.0,
        votes: 0,
        subdomain: '#'
      };

      let relevanciaPersonal = 0;
      if (artistaPrincipal && artistasSeguidosIds.includes(artistaPrincipal._id.toString())) relevanciaPersonal += 10;
      if (ev.establecimiento && lugaresSeguidosIds.includes(ev.establecimiento._id.toString())) relevanciaPersonal += 5;
      if (artistaPrincipal && misPreferencias.includes(artistaPrincipal.subcategoria)) relevanciaPersonal += 3;

      return {
        ...ev,
        distancia: dist,
        relevanciaPersonal,
        artista: artistaFallback,
        urlArtista: artistaPrincipal ? construirUrlSubdominio(req, artistaPrincipal.subdomain) : '#',
        urlEstablecimiento: ev.establecimiento ? construirUrlSubdominio(req, ev.establecimiento.subdomain) : null
      };
    });

    eventos.sort((a, b) => b.relevanciaPersonal - a.relevanciaPersonal || a.distancia - b.distancia || new Date(a.fechaInicio) - new Date(b.fechaInicio));

    const resultadosPaginados = eventos.slice(skip, skip + limit);
    res.json(resultadosPaginados);
  } catch (error) {
    console.error("❌ Error en API events-nearby:", error);
    res.status(500).json({ error: "Error interno de base de datos en la grilla principal" });
  }
});

// --- 7. RUTAS DE VISTAS Y AUTENTICACIÓN ---
app.get('/auth/login', (req, res) => {
  res.render('login', { error: req.query.error ? 'Credenciales inválidas. Verifica tu correo y clave.' : null });
});

app.post('/auth/login', passport.authenticate('local', {
  successRedirect: '/panel',
  failureRedirect: '/auth/login?error=1'
}));

app.get('/panel', requireAuth, PanelController.renderPanel);

// Actualizaciones de perfiles protegidas
app.post('/panel/artist/update', requireAuth, upload.fields([
  { name: 'logoFile', maxCount: 1 },
  { name: 'bannerFile', maxCount: 1 }
]), PanelController.updateArtistProfile);

app.post('/panel/place/update', requireAuth, PanelController.updatePlaceProfile);
app.post('/api/events/:id/respond-invite', requireAuth, PanelController.respondEventInvite);
app.post('/api/events/:id/cancel', requireAuth, PanelController.cancelEventByCreator);
app.post('/api/events/:id/dismiss-cancelled', requireAuth, PanelController.dismissCancelledEvent);


// Rutas de Creación de Evento
app.get('/events/new', requireAuth, EventController.renderCreateEvent);

// Rutas de Edición de Evento
app.get('/events/edit/:id', requireAuth, EventController.renderEditEvent);

app.get('/api/artists/search', EventController.searchArtists);
app.get('/api/places/search', EventController.searchPlaces);
app.post('/api/events/create', requireAuth, upload.single('flyerFile'), EventController.createEvent);

app.get('/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid', { path: '/' });
      res.redirect('/auth/login');
    });
  });
});

// --- 8. DESPACHADOR DE SUBDOMINIOS ---
app.get('/', async (req, res) => {
  try {
    const subdominioActual = req.subdominioActual;

    if (subdominioActual) {
      const artista = await Artist.findOne({ subdomain: subdominioActual });
      if (artista) {
        const eventos = await Event.find({ 'artistas.artistaId': artista._id }).populate('establecimiento').sort({ fechaInicio: 1 });
        const artistaPlano = JSON.parse(JSON.stringify(artista));

        // Mapeo dinámico de Paleta + Tipografía para el Profile Público
        const paletaId = artistaPlano.personalizacion?.paletaColoresId || 'paleta_1';
        const colores = DICCIONARIO_PALETAS[paletaId] || DICCIONARIO_PALETAS['paleta_1'];
        const fuenteElegida = artistaPlano.personalizacion?.tipoLetra || 'Roboto';

        artistaPlano.theme = {
          primaryColor: colores.accent,
          secondaryColor: colores.accent,
          backgroundColor: colores.bg,
          textColor: colores.text,
          accentColor: colores.accent,
          fontFamily: fuenteElegida
        };

        const poolElenco = artistaPlano.elenco || [];
        const integrantesConFoto = poolElenco.filter(m => m.fotoPerfil !== null && m.fotoPerfil !== '');
        const integrantesSinFoto = poolElenco.filter(m => m.fotoPerfil === null || m.fotoPerfil === '');

        return res.render('artist-profile', { 
          artist: artistaPlano, 
          upcomingEvents: eventos,
          averageRating: artista.score || 5.0,
          reviews: artista.reviews || [],
          featuredCast: integrantesConFoto.map(m => ({ name: m.nombreApellido, role: m.funcion, foto: m.fotoPerfil })), 
          generalCast: integrantesSinFoto.map(m => ({ name: m.nombreApellido, role: m.funcion })) 
        });
      }

      const lugar = await Place.findOne({ subdomain: subdominioActual });
      if (lugar) {
        const eventos = await Event.find({ establecimiento: lugar._id }).populate('artistas.artistaId').sort({ fechaInicio: 1 });
        const lugarPlano = JSON.parse(JSON.stringify(lugar));
        lugarPlano.theme = { primaryColor: '#0d4b75', secondaryColor: '#e75b37', backgroundColor: '#f8f9fa', textColor: '#212529' };

        return res.render('place-profile', { 
          lugar: lugarPlano, 
          eventos: eventos.map(ev => ({ ...ev, artista: ev.artistas?.[0]?.artistaId || null })),
          reviews: lugarPlano.reviews || [],
          averageRating: lugarPlano.score || 5.0
        });
      }

      return res.status(404).send('<h3>La Fanpage solicitada no existe en toc.ar</h3>');
    }

    res.render('landing');
  } catch (error) {
    console.error("❌ Error en el despachador raíz de subdominios:", error);
    res.status(500).send("Error interno en el servidor");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://toc.ar:${PORT}`));