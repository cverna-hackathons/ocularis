'use strict';

let passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    expressSession = require('express-session'),
    Users = require('../../models').User;

passport.use(new LocalStrategy({
    usernameField: 'email'
  },
  (email, password, done) => {
    Users.find({
      where: {
        email: email,
        password: password
      }
    }).then(user => {
      return done(null, user);
    }).catch(err => {
      return done(err);
    });
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  Users.findById(id)
    .then(user => {
      done(null, user);
    })
    .catch(err => {
      done(err);
    });
});

module.exports = app => {
  app.use(expressSession({
    secret: 'OcularisRules',
    resave: true,
    saveUninitialized: false
  }));
  app.use(passport.initialize());
  app.use(passport.session());
}
