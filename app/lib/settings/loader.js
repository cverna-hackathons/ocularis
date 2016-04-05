module.exports = (function() {
  
  const sandbox = require('../sandbox/lib')();

  function getSettings(user_email, done) {
    return done(null, defaultSettings());
  }

  function defaultSettings() {
    var DEFAULTS = {
      name: 'Default world',
      debug: false,
      background: {
        color: '#eee'
      },
      ui: {
        activationKey: 'spacebar'
      },
      components: [
        {
          name: 'ocularis-pane',
          id: 'twitter-ocularis-pane',
          provider: {
            type: 'feed',
            name: 'Twitter feed',
            description: 'Provides twitter feed browsing.',
            id: 'twitter'
          }
        },
        {
          name: 'ocularis-pane',
          id: 'hn-ocularis-pane',
          provider: {
            type: 'feed',
            name: 'HN feed',
            description: 'Provides HN feed browsing.',
            id: 'hn'
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