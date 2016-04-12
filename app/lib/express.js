'use strict'

let express         = require('express');
let glob            = require('glob');
let logger          = require('morgan');
let cookieParser    = require('cookie-parser');
let bodyParser      = require('body-parser');
let compress        = require('compression');
let methodOverride  = require('method-override');
let exphbs          = require('express-handlebars');
let session         = require('express-session');
let pgSession       = require('connect-pg-simple')(session);
let dbConfig        = require('../config/database');
let pg              = require('pg');
let models          = require('../models');

module.exports = function(app, config) {
  let env = process.env.NODE_ENV || 'development';
  app.locals.ENV = env;
  app.locals.ENV_DEVELOPMENT = env == 'development';

  app.engine('handlebars', exphbs({
    layoutsDir: config.root + '/app/views/layouts/',
    defaultLayout: 'main',
    partialsDir: [config.root + '/app/views/partials/']
  }));
  app.set('views', config.root + '/app/views');
  app.set('view engine', 'handlebars');
  app.use(logger('dev', {
    format: 'dev',
    skip: (req, res) => (res.statusCode === 304),
  }));
  app.use(session({
    store: new pgSession({
      pg,
      conString : dbConfig[env].uri,
      tableName : 'UserSessions'
    }),
    secret: config.sessionSecret,
    resave: true,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days 
  }));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(cookieParser());
  app.use(compress());
  app.use(express.static(config.root + '/public'));
  app.use(methodOverride());

  //setup authentification
  require('./auth/init')(app);
  //setup routes
  require('../controllers/routes')(app);

  // After routes, define 404 if we have not matched any route previously
  app.use(function (req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: err,
        title: 'error'
      });
    });
  }

  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: {},
        title: 'error'
      });
  });

  //automatic creation of tables
  models.sequelize
    .sync()
    .catch(err => console.log('database connection error:', err));

  app.listen(config.port, () => {
    console.log(`OCULARIS Listening on port: ${config.port}.`);
  });

};
