/**
 * Servicio de perfiles - Gestión de temas y personalización
 */

/**
 * Diccionario completo de paletas de colores para perfiles
 */
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

/**
 * Obtiene los colores de una paleta específica
 * @param {string} paletaId - ID de la paleta (ej: 'paleta_1')
 * @returns {object} Objeto con colores bg, accent, text
 */
function obtenerColoresPaleta(paletaId) {
  return DICCIONARIO_PALETAS[paletaId] || DICCIONARIO_PALETAS['paleta_1'];
}

/**
 * Genera el tema completo para un perfil de artista
 * @param {Object} artista - Documento del artista
 * @returns {Object} Tema con colores y tipografía
 */
function generarTemaArtista(artista) {
  const artistaPlano = typeof artista.toObject === 'function' ? artista.toObject() : artista;
  
  const paletaId = artistaPlano.personalizacion?.paletaColoresId || 'paleta_1';
  const colores = obtenerColoresPaleta(paletaId);
  const fuenteElegida = artistaPlano.personalizacion?.tipoLetra || 'Roboto';

  return {
    primaryColor: colores.accent,
    secondaryColor: colores.accent,
    backgroundColor: colores.bg,
    textColor: colores.text,
    accentColor: colores.accent,
    fontFamily: fuenteElegida
  };
}

/**
 * Genera el tema por defecto para un perfil de establecimiento
 * @returns {Object} Tema con colores predefinidos
 */
function generarTemaEstablecimiento() {
  return {
    primaryColor: '#0d4b75',
    secondaryColor: '#e75b37',
    backgroundColor: '#f8f9fa',
    textColor: '#212529'
  };
}

/**
 * Clasifica los miembros del elenco por foto
 * @param {Array} elenco - Array de miembros del elenco
 * @returns {Object} Objeto con featuredCast y generalCast
 */
function clasificarElenco(elenco) {
  const poolElenco = elenco || [];
  const integrantesConFoto = poolElenco.filter(m => m.fotoPerfil !== null && m.fotoPerfil !== '');
  const integrantesSinFoto = poolElenco.filter(m => m.fotoPerfil === null || m.fotoPerfil === '');

  return {
    featuredCast: integrantesConFoto.map(m => ({
      name: m.nombreApellido,
      role: m.funcion,
      foto: m.fotoPerfil
    })),
    generalCast: integrantesSinFoto.map(m => ({
      name: m.nombreApellido,
      role: m.funcion
    }))
  };
}

module.exports = {
  DICCIONARIO_PALETAS,
  obtenerColoresPaleta,
  generarTemaArtista,
  generarTemaEstablecimiento,
  clasificarElenco
};
