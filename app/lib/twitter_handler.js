module.exports = (function() {
  var Twitter = require('twitter');
  var config = require('./../../config/config');
  var tw_conf = config.twitter

  var client = new Twitter({
    consumer_key: tw_conf.key,
    consumer_secret: tw_conf.secret,
    access_token_key: tw_conf.token_key,
    access_token_secret: tw_conf.token_secret
  });

  return client;
})();
