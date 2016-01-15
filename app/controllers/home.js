var express = require('express'),
  router = express.Router(),
  db = require('../models'),
  twitter_handler = require('../lib/twitter_handler');

module.exports = function (app) {
  app.use('/', router);
};

router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Ocularis'
  });
});


