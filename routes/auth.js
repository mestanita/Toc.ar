const express = require('express');
const router = express.Router();
const passport = require('passport');
const { requireAuth } = require('../middlewares/auth');

/**
 * @route GET /auth/login
 * @desc Muestra el formulario de login
 */
router.get('/login', (req, res) => {
  res.render('login', { 
    error: req.query.error ? 'Credenciales inválidas. Verifica tu correo y clave.' : null 
  });
});

/**
 * @route POST /auth/login
 * @desc Procesa el inicio de sesión con estrategia local
 */
router.post('/login', 
  passport.authenticate('local', {
    successRedirect: '/panel',
    failureRedirect: '/auth/login?error=1'
  })
);

/**
 * @route GET /auth/logout
 * @desc Cierra la sesión del usuario
 */
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid', { path: '/' });
      res.redirect('/auth/login');
    });
  });
});

module.exports = router;
