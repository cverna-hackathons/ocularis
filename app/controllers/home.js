'use strict'

const DEFAULT_SETTINGS = {
  components: [ 
    { name: 'ocularis-cube', publicUrl: '/sandbox/ocularis-cube.js' } 
  ],
  time: Date.now()
};

module.exports = app => {

  var path = require('path');
  // Render main page
  app.get('/vr', (req, res) => res.render('scene', { 
    title: 'Ocularis',
    layout: 'vr'
  }));

  app.get('/', (req, res) => res.render('index', { 
    title: 'Ocularis',
    settings: DEFAULT_SETTINGS
  }));

  // Load structure for the user, WIP
  app.get('/load_settings', (req, res) => {
    res.send({
      settings: DEFAULT_SETTINGS
    });
  });

  app.post('/feed', (req, res) => {
    var options = req.body;
    var providerName = options.provider;
    var providerPath = path.normalize(
      __dirname + './../lib/providers/' + providerName
    );
    var feedProvider = require(providerPath);

    if (typeof feedProvider === 'object') {
      feedProvider.getElements(options, (err, elements) => {
        res.send({
          elements: elements,
          error: err
        });
      });
    }
    else {
      res.send({
        elements: [],
        error: 'Feed provider specified does not exist.'
      });
    }
  });
};
