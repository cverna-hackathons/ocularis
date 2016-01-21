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

router.post('/feed', function(req, res) {
  if(!req.body.channelScreenName) {
    res.json([]);
    return;
  }

  twitter_handler.get('statuses/user_timeline', {
    screen_name: req.body.channelScreenName, 
    count: parseInt(req.body.loadCountLimit || 20)
  }, function (err, tweets) { 
    console.log(tweets)
    res.send(tweets); 
  });
});
