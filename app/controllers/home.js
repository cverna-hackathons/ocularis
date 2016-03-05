'use strict'


const settingsLoader  = require('../lib/settings/loader');

module.exports = app => {

  var path = require('path');
  // Render main page
  app.get('/vr', (req, res) => {
    res.render('scene', { 
      title: 'Ocularis - VR world',
      layout: 'vr'
    });
  });

  app.get('/', (req, res) => {
    settingsLoader.getSettings(null, (err, settings) => {
      res.render('index', { 
        title: 'Ocularis - VR constructor',
        settings: settings
      });
    });
  });

  // Load structure for the user, WIP
  app.get('/load_settings', (req, res) => {
    settingsLoader.getSettings(null, (err, settings) => {
      res.send({
        settings: settings
      });
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
