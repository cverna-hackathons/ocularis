'use strict'

module.exports = (function () {

  var Twitter = require('twitter');
  var path = require('path');
  var _    = require('underscore');
  var configPath = path.normalize(__dirname + './../../lib/config');
  var config = require(configPath);
  var client = new Twitter(config.twitter);

  function getElements(options, done) {
    console.log('getElements')
    if (options.screenName) {
      client.get('statuses/user_timeline', {
        screen_name: options.screenName,
        count: options.limit
      }, done);
      // return done(null, [{ id: Date.now(), text: 'Hello' }]);
    }
    else return done('Twitter screen name needs to be provided.', []);
  }

  function transformElements(elements) {
    var transformed = [];
    
    elements.forEach(transform);
    return transformed;

    function transform(element) {
      var elem = {
        id: element.id,
        created_at_str: element.created_at,
        created_at: +(new Date(element.created_at)),
        text: formatText(element)
      };
      transformed.push(elem);
    }
  }


  function formatText(element) {
    return ('@' + element.user.screen_name + ': ' + element.text);
  }

  return {
    getElements: getElements
  };

})();
