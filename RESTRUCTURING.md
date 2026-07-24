# Reestructuración del Código - toc.ar

## Resumen de Cambios

Este documento describe la reestructuración realizada al código base para mejorar la organización, mantenibilidad y escalabilidad del proyecto.

## Nueva Estructura de Directorios

```
/workspace
├── app.js                    # Archivo principal (sin cambios)
├── config/
│   └── passport.js           # Configuración de Passport (modularizado)
├── controllers/
│   ├── ArtistController.js
│   ├── EventController.js
│   ├── EventControllers.js
│   ├── PanelController.js
│   └── ReviewController.js
├── middlewares/
│   ├── subdomain.js          # Middleware de subdominios existente
│   └── auth/
│       └── index.js          # Nuevos middlewares de autenticación
├── models/
│   ├── Artist.js
│   ├── Event.js
│   ├── Events.js
│   ├── Place.js
│   ├── Review.js
│   ├── Ticket.js
│   └── User.js               # Renombrado (user.js -> User.js)
├── routes/                   # NUEVO: Enrutamiento modular
│   ├── api.js                # Rutas de API REST
│   ├── auth.js               # Rutas de autenticación
│   ├── events.js             # Rutas de eventos
│   ├── index.js              # Ruta raíz con subdominios
│   └── panel.js              # Rutas del panel de control
├── services/                 # NUEVO: Lógica de negocio
│   ├── eventService.js       # Servicios relacionados a eventos
│   ├── geoService.js         # Servicios de geolocalización
│   ├── profileService.js     # Servicios de perfiles y temas
│   └── subdomainService.js   # Servicios de subdominios
├── utils/                    # NUEVO: Utilidades generales
├── views/
├── public/
└── node_modules/
```

## Archivos Nuevos Creados

### 1. Servicios (`/services`)

- **geoService.js**: Funciones de cálculo de distancias y coordenadas
  - `calcularDistanciaKm()`
  - `crearGeoJsonPoint()`
  - `estaEnRadio()`

- **subdomainService.js**: Gestión de URLs y subdominios
  - `construirUrlSubdominio()`
  - `construirUrlDominioPrincipal()`
  - `extraerSubdominio()`

- **eventService.js**: Lógica de negocio para eventos
  - `generarCodigoCorto()`
  - `obtenerCodigoUrlUnico()`
  - `prepararArtistas()`
  - `determinarEstadoLugar()`
  - `determinarEstadoGeneral()`
  - `obtenerImagenEvento()`
  - `enriquecerEvento()`

- **profileService.js**: Gestión de temas y personalización
  - `DICCIONARIO_PALETAS`
  - `obtenerColoresPaleta()`
  - `generarTemaArtista()`
  - `generarTemaEstablecimiento()`
  - `clasificarElenco()`

### 2. Rutas (`/routes`)

- **auth.js**: Login/logout
- **panel.js**: Panel de control (artistas, establecimientos, espectadores)
- **events.js**: Creación y gestión de eventos
- **api.js**: APIs públicas (events-featured, events-nearby)
- **index.js**: Ruta raíz con manejo de subdominios

### 3. Middlewares (`/middlewares/auth`)

- **index.js**: Middlewares reutilizables
  - `requireAuth`: Verifica autenticación
  - `requireRole`: Verifica rol específico
  - `isOwner`: Verifica propiedad de recurso

## Beneficios de la Reestructuración

1. **Separación de Responsabilidades**: 
   - Controllers manejan HTTP
   - Services manejan lógica de negocio
   - Routes definen endpoints

2. **Reutilización de Código**: 
   - Servicios compartidos entre controllers
   - Middlewares reutilizables

3. **Mantenibilidad**: 
   - Código más fácil de leer y depurar
   - Cambios localizados en módulos específicos

4. **Escalabilidad**: 
   - Fácil agregar nuevas rutas o servicios
   - Testing simplificado por módulos aislados

## Próximos Pasos Sugeridos

1. Actualizar `app.js` para usar las nuevas rutas modulares
2. Migrar lógica duplicada a los servicios
3. Agregar tests unitarios para cada servicio
4. Documentar APIs con JSDoc completo

## Notas Importantes

- El archivo `models/user.js` fue renombrado a `models/User.js` para mantener consistencia
- La configuración de Passport ahora exporta una función modular
- Los servicios están diseñados para ser stateless y testables
