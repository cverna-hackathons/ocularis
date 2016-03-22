module.exports = (function() {
  
  const sandbox = require('../sandbox/lib')();

  function getSettings(user_email, done) {
    return done(null, defaultSettings());
  }

  function defaultSettings() {
    var DEFAULTS = {
      name: 'Default world',
      debug: true,
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
          name: 'ocularis-cube',
          id: 'ld-ocularis-cube',
          provider: {
            type: 'feed',
            name: 'LD feed',
            description: 'Provides LD feed browsing.',
            id: 'ld'
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