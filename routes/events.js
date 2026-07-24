const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const EventController = require('../controllers/EventController');

/**
 * @route GET /events/new
 * @desc Muestra el formulario de creación de eventos
 * @access Privado
 */
router.get('/new', requireAuth, EventController.renderCreateEvent);

/**
 * @route GET /events/edit/:id
 * @desc Muestra el formulario de edición de eventos
 * @access Privado
 */
router.get('/edit/:id', requireAuth, EventController.renderEditEvent);

/**
 * @route POST /api/events/update/:id
 * @desc Actualiza un evento existente
 * @access Privado
 */
router.post('/update/:id', 
  requireAuth, 
  // El middleware upload.single se inyectará desde app.js
  EventController.updateEvent
);

/**
 * @route GET /api/artists/search
 * @desc Busca artistas por nombre (autocomplete)
 * @access Público
 */
router.get('/api/artists/search', EventController.searchArtists);

/**
 * @route GET /api/places/search
 * @desc Busca establecimientos por nombre (autocomplete)
 * @access Público
 */
router.get('/api/places/search', EventController.searchPlaces);

/**
 * @route POST /api/events/create
 * @desc Crea un nuevo evento
 * @access Privado
 */
router.post('/create', 
  requireAuth, 
  // El middleware upload.single se inyectará desde app.js
  EventController.createEvent
);

module.exports = router;
