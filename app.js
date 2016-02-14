var express = require('express');
var config = require('./app/lib/config');
var app = express();

require('./app/lib/express')(app, config);

