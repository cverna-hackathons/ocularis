'use strict';

let sandbox = require('../app/lib/sandbox/lib')();
let async = require('async');
// TODO: Replace to read all registered/approved components

async.eachSeries(['ocularis-pane'], (cName, next) => {
  sandbox.createComponentFile({ 
    name: cName 
  }, next);
}, (err) => process.exit());
