'use strict';


var sandbox = require('../sandbox/lib')();

sandbox.createComponentFile({
  name: 'ocularis-cube'
}, (err) => {
  console.log('err:', err);
});