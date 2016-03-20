'use strict'


const settingsLoader  = require('../lib/settings/loader');
let isAuth = require('../lib/auth/is-auth');
let route = require('express').Router();
let passport = require('passport');

route.get('/', (req, res) => {
  res.render('main');
});

route.get('/login', (req, res) => {
  res.render('login', {
    title: 'Login'
  });
});

route.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

route.get('/vr', (req, res) => {
  res.render('scene', { 
    title: 'Ocularis - VR world',
    layout: 'vr'
  });
});

// Load structure for the user, WIP
route.get('/load_settings', (req, res) => {
  settingsLoader.getSettings(null, (err, settings) => {
    res.send({ settings: settings });
  });
});

route.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

module.exports = route;
