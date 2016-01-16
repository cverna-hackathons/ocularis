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

router.get('/feed', function(req, res) {
  twitter_handler.get('statuses/user_timeline', {screen_name: 'jCobbSK', count: 100}, function(err, tweets){
    res.json(tweets.length);
  });
});
