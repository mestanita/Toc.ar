/**
 * Servicio de geolocalización - Cálculos de distancia y coordenadas
 */

const RADIO_TIERRA_KM = 6371;

/**
 * Calcula la distancia entre dos puntos en kilómetros usando la fórmula del Haversine
 * @param {number} lat1 - Latitud del punto 1
 * @param {number} lon1 - Longitud del punto 1
 * @param {number} lat2 - Latitud del punto 2
 * @param {number} lon2 - Longitud del punto 2
 * @returns {number} Distancia en kilómetros
 */
function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) + 
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  return RADIO_TIERRA_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/**
 * Formatea coordenadas para GeoJSON
 * @param {number} lng - Longitud
 * @param {number} lat - Latitud
 * @returns {object} Objeto GeoJSON Point
 */
function crearGeoJsonPoint(lng, lat) {
  return {
    type: 'Point',
    coordinates: [lng, lat]
  };
}

/**
 * Verifica si un punto está dentro de un radio determinado
 * @param {number} puntoLat - Latitud del punto a verificar
 * @param {number} puntoLng - Longitud del punto a verificar
 * @param {number} centroLat - Latitud del centro
 * @param {number} centroLng - Longitud del centro
 * @param {number} radioKm - Radio en kilómetros
 * @returns {boolean} True si está dentro del radio
 */
function estaEnRadio(puntoLat, puntoLng, centroLat, centroLng, radioKm) {
  const distancia = calcularDistanciaKm(puntoLat, puntoLng, centroLat, centroLng);
  return distancia <= radioKm;
}

module.exports = {
  calcularDistanciaKm,
  crearGeoJsonPoint,
  estaEnRadio,
  RADIO_TIERRA_KM
};
