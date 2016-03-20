'use strict';

/**
 * Task for registering component to system. Task expecting 3 arguments,
 * firstly we decide if component should be fetched by npm or should
 * be cloned from repository (we need to have clone access to repository
 * in this case)
 */

let path = require('path');
let models = require('../app/models');
let async = require('async');
let cProc = require('child_process');
let moduleDirToSandbox = path.resolve(__dirname, '../app/lib/sandbox');
let moduleDirToSandboxModules = path.resolve(moduleDirToSandbox, 'node_modules');

let args = process.argv.slice(2);
let getByNpm = args[0];
let name = args[1];
let url = args[2];

if (!name || !url) {
  console.error('Not provided name or/and url. Exiting.');
  process.exit(1);
}

//we need to fetch module and parse manifest and persist data
let move = (getByNpm == 'true') ? `cd ${moduleDirToSandbox}` : `cd ${moduleDirToSandboxModules}`;
let buildCommand = (getByNpm == 'true') ? `npm install --save ${name}` : `git clone ${url}`;
let postbuildCommand = ((getByNpm == 'true') ? `cd node_modules/${name}` : `cd ${name}`) + ` && npm install && npm run build`;
let cmd = `${move} && ${buildCommand} && ${postbuildCommand}`;

cProc.exec(cmd, (err) => {
  if (err) {
    console.error('Couldn\'t fetch the module');
    process.exit(1);
  }

  //at this point we have fetched repo inside sandbox modules
  //now we need to parse its manifest and persist in DBS
  let manifest = require(`${path.resolve(moduleDirToSandboxModules, name, 'ocularis-manifest.json')}`);

  //TODO handle update of existing component



  process.exit(0);
  //final step is to rebuild front-end of app, so
  //new component is available for public
  cProc.exec(`cd ${path.resolve(__dirname, '../')} && npm run build:components`);
})
