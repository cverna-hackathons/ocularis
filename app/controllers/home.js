'use strict'

var express         = require('express');
var router          = express.Router();
var twitter_handler = require('../lib/twitter_handler');

module.exports = app => app.use('/', router);

router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Ocularis'
  });
});

router.post('/feed', function(req, res) {
  if(!req.body.channelScreenName) {
    res.json([]);
    return;
  }

  twitter_handler.get('statuses/user_timeline', {
    screen_name: req.body.channelScreenName, 
    count: parseInt(req.body.loadCountLimit || 20)
  }, (err, tweets) => res.send(tweets));
});
