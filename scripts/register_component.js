'use strict';

/**
 * Task for registering component to system. Task is expecting 3 arguments,
 * firstly we decide if component should be fetched by npm or should
 * be cloned from repository (we need to have clone access to repository
 * in this case)
 *
 * e.q node ./register_compnent false ocularis-cube git@github.com:cverna-hackathons/ocularis-cube.git
 */

let path                    = require('path');
let models                  = require('../app/models');
let async                   = require('async');
let cProc                   = require('child_process');
let dirToSandbox            = path.resolve(__dirname, '../app/lib/sandbox');
let dirToSandboxModule      = path.resolve(dirToSandbox, 'lib');
let sandbox                 = require(dirToSandboxModule)();
let dirToSandboxComponents  = path.resolve(dirToSandbox, 'components');

let args                    = process.argv.slice(2);
let getByNpm                = (args[0] === 'true');
let name                    = args[1];
let url                     = args[2];

/**
 * @IMPORTANT
 * This flag set if data types are created if not exists in DBS.
 * It may be misuse in production environment.
 */
let CREATING_DATA_TYPES = true;

if (!name || !url) {
  console.error('Name or/and url not provided. Exiting...');
  process.exit(1);
}

//we need to fetch module and parse manifest and persist data
let cmds = [
  // clean up
  (getByNpm ? 
      `cd ${dirToSandbox} && rm -rf ${name}` : 
      `cd ${dirToSandboxComponents} && rm -rf ${name}`
  ),
  // build
  (getByNpm ? `npm install --save ${name}` : `git clone ${url}`),
  // post build
  ((
    getByNpm ? `cd node_modules/${name}` : `cd ${name}`
  ) + ` && npm install && npm run build`)
];

let cmd = cmds.join(' && ');
console.log('Running: ', cmd);

cProc.exec(cmd, (err) => {
  if (err) {
    console.error(`Couldn\'t fetch the module: ${err}`);
    process.exit(1);
  }

  //at this point we have fetched repo inside sandbox modules
  //now we need to parse its manifest and persist in DBS
  let manifest = require(
    `${path.resolve(dirToSandboxComponents, name, 'ocularis-manifest.json')}`
  );

  models.Component.find({
    where: {
      name: name,
      url: url
    }
  }).then((component) => {
    if(component) {
      updateComponent(component, manifest, resolve)
    } else createComponent(manifest, resolve);

    function resolve(err) {
      if (err) {
        console.error(err);
        process.exit(1);
      } else {
        console.log(`Component ${name} saved, building front-end file.`);
        //final step is to rebuild front-end of app, so
        //new component is available for public
        sandbox.createComponentFile({ name }, (err) => {
          if (err) {
            console.error('Unable to build components, exiting');
            process.exit(1);
          } else {
            console.log(`Finished component (${name}) registration.`);
            process.exit(0);
          }
        });
      }
    }
  });

});

/**
 * Update component already stored in database, with possible
 * updated manifest.
 * @param  {models.Component} component
 * @param  {Object} manifest
 * @return {Promise}
 */
function updateComponent(component, manifest, done) {
  console.log('Updating component...');
  //TODO
  component.destroy({force: true}).then(() => createComponent(manifest, done));
}

/**
 * Create component and all its relations based on provided manifest.
 * @param  {Object} manifest
 * @return {Promise}
 */
function createComponent(manifest, done) {
  console.log('Creating component...');

  let allUsedTypes = manifest.fields.reduce((prevVal, f) => {
    return prevVal.concat(f.types);
  }, []);

  models.Component.create({
    libName: manifest.name,
    name: manifest.name,
    url: manifest.url,
    byNpm: getByNpm
  }).then((component) => {
    console.log('Component created.');
    findOrCreateAllTypes(allUsedTypes, (err, types) => {
      if (err) { 
        console.error(`Error while creating data types [${err}].`);
        return done(err); 
      }

      let fieldsPromises = manifest.fields.reduce((prevVal, f) => {
        let fieldTypes = types.filter((t) => (f.types.indexOf(t.name) !== -1));
        prevVal.push(next => {
          let newCF = models.ComponentField.create({
            name: f.name
          }).then((field) => {
            async.parallel([
              (_c) => field.setComponent(component)
                .then(() => _c())
                .catch(err => _c(err)),
              (_c) => field.setDataTypes(fieldTypes)
                .then(() => _c())
                .catch(err => _c(err))
            ], (err, results) => next(err));
          })
          .catch(err => next(err));
        });
        return prevVal;
      }, []);
      console.log('Creating component fields...');
      async.parallel(fieldsPromises, done);
    });
  }).catch(done);
}

function findOrCreateAllTypes(types, done) {
  let promises = [];
  if (!CREATING_DATA_TYPES) {
    models.DataType.findAll({ where: { name: { $in: types } } })
      .then((results) => done(null, results))
      .catch(done);
    return;
  }

  types.forEach((typeName) => {
    promises.push(next => {
        models.DataType.findOrCreate({ where: { name: typeName } })
          .then((dataType) => next(null, dataType[0]))
          .catch(next);
    });
  });
  async.parallel(promises, done);
}
