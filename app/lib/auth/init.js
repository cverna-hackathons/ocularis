'use strict';

let passport        = require('passport');
let LocalStrategy   = require('passport-local').Strategy;
let expressSession  = require('express-session');
let Users           = require('../../models').User;
let _               = require('underscore');

passport.use(new LocalStrategy({
    usernameField: 'email'
  }, (email, password, done) => {
    Users.find({ where: { email, password } })
      .then(user => done(null, user))
      .catch(done);
  }
));

passport.serializeUser(
  (user, done) => done(null, _.pick(user, ['id', 'username']))
);

passport.deserializeUser((_user, done) => {
  Users.findById(_user.id)
    .then(user => done(null, user))
    .catch(done);
});

module.exports = app => {
  app.use(passport.initialize());
  app.use(passport.session());
};