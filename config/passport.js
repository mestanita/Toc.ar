const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

/**
 * Configura las estrategias de Passport
 * @param {object} passport - Instancia de Passport
 */
module.exports = function(passport) {
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

  // CONFIGURACIÓN DE GOOGLE STRATEGY
  passport.use(new GoogleStrategy({
      clientID: "1048889829307-bajg6o8m1hdukq307go1hd2j40nreei6.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: "/auth/google/callback",
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          const firstName = profile.name?.givenName || '';
          const lastName = profile.name?.familyName || '';

          user = await User.create({
            uid: profile.id,
            provider: 'google',
            nombre: profile.displayName,
            email: profile.emails ? profile.emails[0].value : '',
            avatar: profile.photos ? profile.photos[0].value : ''
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  ));

  // CONFIGURACIÓN DE FACEBOOK STRATEGY
  passport.use(new FacebookStrategy({
      clientID: "1616581817143958",
      clientSecret: "0798fcb0e91d058bb09c80bc005159b6",
      callbackURL: "/auth/facebook/callback",
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
            uid: profile.id,
            provider: 'facebook',
            nombre: profile.displayName,
            email: profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`,
            avatar: profile.photos ? profile.photos[0].value : ''
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  ));
};
