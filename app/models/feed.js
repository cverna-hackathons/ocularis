module.exports = function() {
  var Twitter = require('twitter');
  var config = require('./../config/config')
 
  var client = new Twitter({
    consumer_key: '',
    consumer_secret: '',
    access_token_key: '',
    access_token_secret: ''
  });
}