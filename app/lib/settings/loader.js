module.exports = (function() {
  
  const sandbox = require('../sandbox/lib')();

  function getSettings(user_email, done) {
    return done(null, defaultSettings());
  }

  function defaultSettings() {
    var DEFAULTS = {
      name: 'Default world',
      components: [
        {
          name: 'ocularis-cube',
          id: 'twitter-ocularis-cube',
          provider: {
            type: 'feed',
            name: 'Twitter feed',
            description: 'Provides twitter feed browsing.',
            id: 'twitter'
          }
        } 
      ],
      time: Date.now()
    };

    DEFAULTS.components.forEach(sandbox.assignComponentPaths);

    return DEFAULTS;
  }

  return {
    getSettings: getSettings
  }
}) ();