'use strict'


// var router          = express.Router();


// module.exports = app => app.use('/', router);
module.exports = app => {
  var path = require('path');
  // Render main page
  app.get('/', (req, res) => res.render('index', { title: 'Ocularis' }));
  // Load structure for the user, WIP
  app.get('/content/structure', (req, res) => res.send({}));

  app.post('/feed', (req, res) => {
    var options = req.body;
    var providerName = options.provider;
    var providerPath = path.normalize(
      __dirname + './../lib/feed_providers/' + providerName
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
