'use strict';

let passport        = require('passport');
let LocalStrategy   = require('passport-local').Strategy;
let expressSession  = require('express-session');
let Users           = require('../../models').User;

passport.use(new LocalStrategy({
    usernameField: 'email'
  }, (email, password, done) => {
    Users.find({
      where: {
        email: email,
        password: password
      }
    }).then(user => done(null, user)).catch(err => done(err));
  }
));

passport.serializeUser((user, done) => done(null, user));

passport.deserializeUser((_user, done) => {
  Users.findById(_user.id)
    .then(user => done(null, user))
    .catch(err => done(err));
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
