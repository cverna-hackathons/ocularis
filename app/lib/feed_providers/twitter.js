'use strict'

module.exports = (function () {

  var Twitter = require('twitter');
  var path = require('path');
  var configPath = path.normalize(__dirname + './../../lib/config');
  var config = require(configPath);
  var tw_conf = config.twitter;


  var client = new Twitter({
    consumer_key: tw_conf.key,
    consumer_secret: tw_conf.secret,
    access_token_key: tw_conf.token_key,
    access_token_secret: tw_conf.token_secret
  });

  function getElements(options, done) {
    console.log('getElements')
    if (options.screenName) {
      client.get('statuses/user_timeline', {
        screen_name: options.screenName,
        count: options.limit
      }, done)
    }
    else return done('Twitter screen name needs to be provided.', [])
  }

  return {
    getElements: getElements
  };

})();
