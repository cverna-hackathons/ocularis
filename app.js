var express = require('express');
var config = require('./config/config');
var app = express();

require('./config/express')(app, config);

