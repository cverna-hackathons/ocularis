'use strict'


const settingsLoader  = require('../lib/settings/loader');
let isAuth = require('../lib/auth/is-auth');
let route = require('express').Router();
let passport = require('passport');

route.get('/', isAuth, (req, res) => {
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

route.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

module.exports = route;
