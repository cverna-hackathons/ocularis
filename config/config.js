var path = require('path'),
    _ = require('underscore'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development',
    env_config = require('./environments'),
    apis = require('./apis');

var config = {
  root: rootPath
};

module.exports = _.extend(config, env_config[env], apis);
