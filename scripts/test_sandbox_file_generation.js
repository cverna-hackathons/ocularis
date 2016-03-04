'use strict';


var sandbox = require('../app/lib/sandbox/lib')();

sandbox.createComponentFile({
  name: 'ocularis-cube'
}, (err) => {
  console.log('err:', err);
});