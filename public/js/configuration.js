OCULARIS.config = (function() {
  var config = {

  };

  OCULARIS.defaults = {
    feedOptions: {
      twitter: {
        screenName: 'jCobbSK',
        limit: 5
      }
    },
    availableContent: {
      models: [
        {
          provider: 'twitter',
          type: 'feed',
          displayComponent: 'cube'
        }
      ]
    }
  };

  function loadContentStructure(done) {
    $.get('/content/structure', function(response) {
      OCULARIS.engine.availableContent = (
        response && response.structure
      ) ? response.structure : OCULARIS.defaults.availableContent;
      if (done) return done();
    })
  }

  // Assign to the returned object
  config.loadContentStructure = loadContentStructure;

  return config;
}) ();