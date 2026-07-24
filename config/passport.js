const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

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

// CONFIGURACIÓN DE GOOGLE EN config/passport.js
passport.use(new GoogleStrategy({
    clientID: "1048889829307-bajg6o8m1hdukq307go1hd2j40nreei6.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: "/auth/google/callback", // <--- Relativo para que funcione tanto en local como en Ngrok
    proxy: true // <--- Crucial para que Google confíe en el HTTPS del túnel de Ngrok
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        const firstName = profile.name?.givenName || '';
        const lastName = profile.name?.familyName || '';
        
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          firstName: firstName,
          lastName: lastName,
          email: profile.emails ? profile.emails[0].value : '',
          avatar: profile.photos ? profile.photos[0].value : '',
          rawProfileData: profile._json
        });
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// CONFIGURACIÓN DE META REAL (Dentro de config/passport.js)
passport.use(new FacebookStrategy({
	clientID: "1616581817143958", // El número largo de App ID
    clientSecret: "0798fcb0e91d058bb09c80bc005159b6", // La clave secreta de la app
    // 1. Convertimos el callback en relativo para que herede el protocolo (http o https) y el dominio activo:
    callbackURL: "/auth/facebook/callback",
    // 2. Le decimos a Passport que confíe en el encabezado del proxy (necesario para Ngrok)
    proxy: true, 
    profileFields: ['id', 'name', 'displayName', 'emails', 'photos']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ facebookId: profile.id });
      if (!user) {
        const firstName = profile.name?.givenName || '';
        const lastName = profile.name?.familyName || '';
        
        user = await User.create({
          facebookId: profile.id,
          name: profile.displayName,
          firstName: firstName,
          lastName: lastName,
          email: profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`,
          avatar: profile.photos ? profile.photos[0].value : '',
          rawProfileData: profile._json
        });
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));