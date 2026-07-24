// seed-massive.js
const mongoose = require('mongoose');
require('dotenv').config();

const Artist = require('./models/Artist');
const Place = require('./models/Place');
const Event = require('./models/Event');

const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tocar';

// Coordenadas geoespaciales reales para los nodos del Alto Valle [lng, lat]
const CITIES = {
  'Neuquén': [-68.0591, -38.9516],
  'General Roca': [-67.5744, -39.0325],
  'Cipolletti': [-67.9904, -38.9403],
  'Allen': [-67.8267, -38.9789],
  'Villa Regina': [-67.0867, -39.1014]
};

function generarFechaFutura(dias, hora) {
  const f = new Date();
  f.setDate(f.getDate() + dias);
  f.setHours(hora, 0, 0, 0);
  return f;
}

async function simularInyeccionMasiva() {
  try {
    console.log('🔄 Conectando a MongoDB para la siembra masiva de datos...');
    await mongoose.connect(dbUri);

    console.log('🗑️ Limpiando registros previos en toc.ar...');
    await Artist.deleteMany({});
    await Place.deleteMany({});
    await Event.deleteMany({});

    // ==========================================
    // 1. GENERACIÓN DE 30 ARTISTAS
    // ==========================================
    console.log('🎸 Creando catálogo de 30 artistas con sus subdominios y elencos...');
    const nombresArtistas = [
      'Tribu 87', 'Persia Rock', 'Ojo Avizor', 'La Mitad de Algo', 'Cerdos Rodantes',
      'Efecto Doppler', 'Distorsión Valle', 'Soles Nocturnos', 'Hijos del Rigor', 'La Estafa Dub',
      'Fisque Menuco Trio', 'Anestesia Rock', 'Piel de Judas', 'Sinfonía Callejera', 'Madame Gula',
      'La Moto Rock', 'Skapaltata', 'Los Chamanes', 'Zorros de Riel', 'Volva Valle',
      'Estación Astor', 'Ruta 22 Blues', 'Mutantes del Comahue', 'Estepa Profunda', 'Viejo Vals',
      'Kermesse Redonda', 'Sueter Cortado', 'Cisnes Negros', 'Perros de Sótano', 'El Ritual del Gusano'
    ];

    const categoriasMapeadas = [
      { cat: 'Música en Vivo', sub: 'Banda de Covers / Tributo' },
      { cat: 'Música en Vivo', sub: 'Banda de Temas Propios (Rock, Pop, Indie, Metal, etc.)' },
      { cat: 'Humor y Artes Escénicas', sub: 'Stand Up Comedy / Monólogos' },
      { cat: 'Magia, Ilusionismo y Variedades', sub: 'Magia de Escenario / Mentalismo' },
      { cat: 'Danza y Performance', sub: 'Show de Danza Temática (Flamenco, Tango, Árabe, Salsa)' }
    ];

    const artistasData = nombresArtistas.map((nombre, idx) => {
      const slug = nombre.toLowerCase().replace(/[^a-z0-9]/g, '');
      const catAsignada = categoriasMapeadas[idx % categoriasMapeadas.length];

      return {
        nombre,
        slug,
        subdomain: slug,
        reseña: `Espectáculo de primer nivel impactando en el circuito cultural del Alto Valle. Trayectoria, sonido potente y una puesta en escena única de ${nombre}.`,
        categoria: catAsignada.cat,
        subcategoria: catAsignada.sub,
        preferenciasEstablecimiento: {
          tiposAptos: ['Sala', 'Teatro', 'Bar', 'Restaurante', 'Festivales'],
          requiereAsientosNumerados: idx % 4 === 0,
          requiereReservaMesas: idx % 3 === 0,
          capacidadMin: 50,
          capacidadMax: 5000,
          estacionamiento: idx % 2 === 0 ? 'SI' : 'Opcional'
        },
        requisitosTecnicos: {
          escenario: 'SI',
          sonido: 'SI',
          iluminacion: 'SI',
          backline: idx % 2 === 0 ? 'SI' : 'Opcional',
          ventaComida: 'Opcional',
          ventaBebidas: 'SI'
        },
        elenco: [
          { nombreApellido: 'Carlos Vocalista', funcion: 'Voz Principal', fotoPerfil: idx % 2 === 0 ? 'https://placehold.co/150x150?text=Carlos' : null },
          { nombreApellido: 'Juan Guitarra', funcion: 'Primera Guitarra', fotoPerfil: 'https://placehold.co/150x150?text=Juan' },
          { nombreApellido: 'Mariano Batería', funcion: 'Batería y Percusión', fotoPerfil: null },
          { nombreApellido: 'Lucas Bajo', funcion: 'Bajo Eléctrico', fotoPerfil: null }
        ],
        redesSociales: {
          instagram: `https://instagram.com/${slug}`,
          facebook: `https://facebook.com/${slug}`,
          email: `${slug}@toc.ar`,
          whatsapp: '542984123456'
        },
        personalizacion: {
          paletaColoresId: idx % 2 === 0 ? 'neon_dark' : 'retro_light',
          tipoLetra: idx % 3 === 0 ? 'Montserrat' : 'Roboto'
        },
        score: parseFloat((4.2 + Math.random() * 0.8).toFixed(1)),
        votes: Math.floor(20 + Math.random() * 150),
        reviews: [
          { comentario: '¡Increíble la energía que manejan en vivo!', estrellas: 5 },
          { comentario: 'Muy buen show, excelente sonido.', estrellas: 4 }
        ],
        siguiendoArtistas: [],
        siguiendoEstablecimientos: []
      };
    });

    const artistasCreados = await Artist.insertMany(artistasData);
    console.log(`✅ ${artistasCreados.length} Artistas creados e indexados.`);

    // ==========================================
    // 2. GENERACIÓN DE 20 ESTABLECIMIENTOS (4 POR CIUDAD)
    // ==========================================
    console.log('🏛️ Creando 20 establecimientos distribuidos uniformemente en el mapa...');
    const bolichesPorCiudad = {
      'Neuquén': ['Mood Live', 'Pirkas Disco', 'Spazio Club', 'Teatro Español Nqn'],
      'General Roca': ['Oktober Bar', 'Tower Rock and Blues', 'Fisque Club Cultural', 'Asociación Española Roca'],
      'Cipolletti': ['Meet Foro Cultural', 'Kimika Eventos', 'Barba Azul Pub', 'La Caja Negra Cipo'],
      'Allen': ['Teatro Municipal Allen', 'Estación Rock Allen', 'La Esquina Restobar', 'Anfiteatro Allen'],
      'Villa Regina': ['La Vieja Estación Regina', 'Regina Beer House', 'El Galpón Pub', 'Circulo Italiano']
    };

    const localesData = [];
    Object.keys(bolichesPorCiudad).forEach(ciudad => {
      bolichesPorCiudad[ciudad].forEach((nombre, idx) => {
        const slug = nombre.toLowerCase().replace(/[^a-z0-9]/g, '');
        localesData.push({
          nombre,
          slug,
          subdomain: slug,
          logo: `https://placehold.co/400x250?text=Logo+${encodeURIComponent(nombre)}`,
          banner: `https://placehold.co/1100x250?text=Banner+${encodeURIComponent(nombre)}`,
          location: {
            type: 'Point',
            coordinates: CITIES[ciudad]
          },
          diasHorarios: 'Miércoles a Domingos de 19:00 a 04:00 hs',
          tipoMacro: idx % 2 === 0 ? 'Gastronomía, Ocio y Vida Nocturna' : 'Espacios Culturales y de Artes Escénicas',
          tipoEspecifico: idx % 2 === 0 ? 'Bar de Música en Vivo (Live Music Bar)' : 'Teatro Independiente / Sala "Caja Negra" (Black Box)',
          capacidad: {
            asientosNumerados: idx % 3 === 0,
            reservaMesas: idx % 2 === 0,
            espectadoresMin: 30,
            espectadoresMax: idx % 2 === 0 ? 1200 : 350,
            estacionamientoPropio: idx % 3 === 0 ? 'SI' : 'NO'
          },
          infraestructuraTecnica: {
            escenario: 'SI', sonido: 'SI', iluminacion: 'SI', backline: 'Opcional', ventaComida: 'SI', ventaBebidas: 'SI'
          },
          tiposArtistasAptos: ['Teatro', 'Banda en vivo', 'Standup', 'Muestra de Arte'],
          redesSociales: { instagram: `https://instagram.com/${slug}`, email: `${slug}@toc.ar` },
          score: parseFloat((4.0 + Math.random() * 1.0).toFixed(1)),
          votes: Math.floor(10 + Math.random() * 100),
          reviews: [{ comentario: 'Excelente atención y gran acústica.', estrellas: 5 }]
        });
      });
    });

    const localesCreados = await Place.insertMany(localesData);
    console.log(`✅ ${localesCreados.length} Establecimientos registrados en el Alto Valle.`);

    // Crear interacciones relacionales previas (Simular que se siguen mutuamente para habilitar la co-organización)
    console.log('🤝 Cruzando relaciones de seguimiento mutuo en la red social...');
    for (let artista of artistasCreados) {
      // Cada artista sigue a 4 locales al azar, y esos locales siguen al artista
      const localesAlAzar = localesCreados.sort(() => 0.5 - Math.random()).slice(0, 4);
      for (let local of localesAlAzar) {
        artista.siguiendoEstablecimientos.push(local._id);
        local.siguiendoArtistas.push(artista._id);
        local.seguidoresArtistas.push(artista._id);
        await local.save();
      }
      await artista.save();
    }

    // ==========================================
    // 3. GENERACIÓN DE 100 EVENTOS (20 POR CIUDAD) + 3 PATROCINADOS POR NODO
    // ==========================================
    console.log('📅 Planificando grilla de 100 eventos cronológicos con subastas activas...');
    const eventosData = [];
    const nombresCiudades = Object.keys(CITIES);

    nombresCiudades.forEach((ciudad, ciudadIdx) => {
      // Filtrar los 4 establecimientos de esta ciudad específica
      const localesDeLaCiudad = localesCreados.filter(l => 
        bolichesPorCiudad[ciudad].includes(l.nombre)
      );

      // Creamos exactamente 20 eventos para esta ciudad (20 * 5 ciudades = 100 eventos)
      for (let i = 0; i < 20; i++) {
        const localAsignado = localesDeLaCiudad[i % localesDeLaCiudad.length];
        // Seleccionamos un artista del pool relativo a esta ciudad para diversificar la cartelera
        const artistaAsignado = artistasCreados[(ciudadIdx * 6 + i) % artistasCreados.length];

        // REGLA: Los primeros 3 eventos de cada ciudad serán PATROCINADOS (Compitiendo en la subasta del banner)
        const esPatrocinado = i < 3; 
        const pujaMonto = esPatrocinado ? (1200 + (i * 450)) : 0; // Supera la base de $1000

        eventosData.push({
          nombre: `${esPatrocinado ? '🔥 Festival' : 'Ciclo'} ${artistaAsignado.nombre} en Vivo`,
          fechaInicio: generarFechaFutura(i + 1, 21),
          fechaFin: generarFechaFutura(i + 1, 23),
          establecimiento: localAsignado._id,
          location: {
            type: 'Point',
            coordinates: localAsignado.location.coordinates
          },
          estaRegistrado: true,
          artistaOrganizador: artistaAsignado._id,
          artistasInvitados: [],
          modalidadAcceso: i % 4 === 0 ? 'Gratis con Registro' : 'Paga Interna',
          precioEntrada: i % 4 === 0 ? 0 : 2500 + (i * 200),
          isSponsored: esPatrocinado,
          pujaMonto: pujaMonto,
          // Simular lista de asistencia previa para validar flujos de testeo
          listaAsistencia: [
            { espectadorId: new mongoose.Types.ObjectId(), tipoPase: 'Compra Online', asistioConfirmadoQR: true, votoEnviado: false },
            { espectadorId: new mongoose.Types.ObjectId(), tipoPase: 'Registro Gratis', asistioConfirmadoQR: false, votoEnviado: false }
          ]
        });
      }
    });

    await Event.insertMany(eventosData);

    console.log('\n======================================================');
    console.log('🎉 INFRAESTRUCTURA DE DATOS SEMBRADA CON ÉXITO');
    console.log(`📍 30 Artistas con riders técnicos y perfiles listos.`);
    console.log(`📍 20 Locales distribuidos en 5 ciudades del Valle.`);
    console.log(`📍 100 Eventos futuros (15 Patrocinados para subastas, 3 por ciudad).`);
    console.log('======================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error trágico durante la siembra masiva:', error);
    process.exit(1);
  }
}

simularInyeccionMasiva();