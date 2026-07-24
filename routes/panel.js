const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const PanelController = require('../controllers/PanelController');

/**
 * @route GET /panel
 * @desc Muestra el panel de control según el rol del usuario
 * @access Privado
 */
router.get('/', requireAuth, PanelController.renderPanel);

/**
 * @route POST /panel/artist/update
 * @desc Actualiza el perfil de un artista
 * @access Privado (Artistas)
 */
router.post('/artist/update', 
  requireAuth, 
  // El middleware upload se inyectará desde app.js
  PanelController.updateArtistProfile
);

/**
 * @route POST /panel/place/update
 * @desc Actualiza el perfil de un establecimiento
 * @access Privado (Establecimientos)
 */
router.post('/place/update', requireAuth, PanelController.updatePlaceProfile);

/**
 * @route POST /api/events/:id/respond-invite
 * @desc Responde a una invitación a evento
 * @access Privado
 */
router.post('/events/:id/respond-invite', requireAuth, PanelController.respondEventInvite);

/**
 * @route POST /api/events/:id/cancel
 * @desc Cancela un evento (solo creador)
 * @access Privado
 */
router.post('/events/:id/cancel', requireAuth, PanelController.cancelEventByCreator);

/**
 * @route POST /api/events/:id/dismiss-cancelled
 * @desc Descarta un evento cancelado de la lista
 * @access Privado
 */
router.post('/events/:id/dismiss-cancelled', requireAuth, PanelController.dismissCancelledEvent);

module.exports = router;
