/**
 * Servicio de subdominios - Construcción y gestión de URLs
 */

/**
 * Construye una URL con subdominio basado en el host actual
 * @param {object} req - Objeto request de Express
 * @param {string} subdominioAlfanumerico - Subdominio a agregar
 * @returns {string} URL completa con subdominio
 */
function construirUrlSubdominio(req, subdominioAlfanumerico) {
  const hostOriginal = req.headers.host || '';
  const protocolo = req.protocol;
  const [hostSinPuerto, puerto] = hostOriginal.split(':');
  const sufijoPuerto = puerto ? `:${puerto}` : '';
  const partesDomain = hostSinPuerto.split('.');

  // Manejo para ngrok
  if (hostSinPuerto.includes('ngrok-free.dev')) {
    if (partesDomain.length > 3) partesDomain.shift();
    return `http://${subdominioAlfanumerico}.${partesDomain.join('.')}${sufijoPuerto}`;
  }

  // Manejo para localhost
  if (hostSinPuerto.includes('localhost')) {
    if (partesDomain.length >= 2 && partesDomain[0] !== 'localhost') {
      partesDomain.shift();
    }
    return `${protocolo}://${subdominioAlfanumerico}.${partesDomain.join('.')}${sufijoPuerto}`;
  }

  // Dominio estándar - quitar subdominio actual si existe
  if (partesDomain.length >= 3) {
    partesDomain.shift();
  }

  return `${protocolo}://${subdominioAlfanumerico}.${partesDomain.join('.')}${sufijoPuerto}`;
}

/**
 * Construye la URL del dominio principal (sin subdominio)
 * @param {object} req - Objeto request de Express
 * @returns {string} URL del dominio principal
 */
function construirUrlDominioPrincipal(req) {
  const hostOriginal = req.headers.host || '';
  const protocolo = req.protocol;
  const [hostSinPuerto, puerto] = hostOriginal.split(':');
  const sufijoPuerto = puerto ? `:${puerto}` : '';
  const partesDomain = hostSinPuerto.split('.');

  if (hostSinPuerto.includes('localhost')) {
    return `${protocolo}://localhost${sufijoPuerto}`;
  }

  if (partesDomain.length >= 3) {
    partesDomain.shift();
  }

  return `${protocolo}://${partesDomain.join('.')}${sufijoPuerto}`;
}

/**
 * Extrae el subdominio del host
 * @param {string} host - Host completo
 * @returns {string|null} Subdominio o null si no existe
 */
function extraerSubdominio(host) {
  const hostLimpio = host.split(':')[0];
  const partes = hostLimpio.split('.');
  
  let subdomain = null;
  
  if (partes.length > 2) {
    subdomain = partes[0].toLowerCase();
  } else if (partes.length === 2 && partes[1] === 'localhost') {
    subdomain = partes[0].toLowerCase();
  }
  
  // Ignorar subdominios de sistema
  const subdominiosSistema = ['www', 'admin', 'api', 'quienva', 'quienvaatocar'];
  if (subdominiosSistema.includes(subdomain)) {
    return null;
  }
  
  return subdomain;
}

module.exports = {
  construirUrlSubdominio,
  construirUrlDominioPrincipal,
  extraerSubdominio
};
