module.exports = function() {
  var Twitter = require('twitter');
  var config = require('./../../config/config')
 
  var client = new Twitter({
    consumer_key: config.twitter.key,
    consumer_secret: config.twitter.secret,
    access_token_key: config.twitter.token_key,
    access_token_secret: config.twitter.token_secret
  });

  return client;
}