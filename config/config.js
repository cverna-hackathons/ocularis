var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'ocularis'
    },
    port: 3000,
    db: 'postgres://localhost/ocularis-development'
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
