var path = require('path');
var _ = require('underscore');
var rootPath = path.normalize(__dirname + '/../..');
var env = process.env.NODE_ENV || 'development';
var env_config = require('../config/environments');
var apis = require('../config/apis');

module.exports = _.extend({ root: rootPath }, env_config[env], apis);
