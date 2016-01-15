var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development',
    apis = require('./apis');

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'ocularis'
    },
    port: 3000,
    db: 'postgres://postgres:XXX@localhost/ocularis-development'
  },

  test: {
    root: rootPath,
    app: {
      name: 'ocularis'
    },
    port: 3000,
    db: 'postgres://localhost/ocularis-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'ocularis'
    },
    port: 3000,
    db: 'postgres://localhost/ocularis-production'
  }
};

module.exports = config[env];
