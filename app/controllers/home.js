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

router.get('/feed/:screenName', function(req, res) {
  if(!req.params.screenName) {
    res.json([]);
    return;
  }

  twitter_handler.get('statuses/user_timeline', {screen_name: req.params.screenName, count: 100}, function(err, tweets){
    res.json(tweets);
  });
});
