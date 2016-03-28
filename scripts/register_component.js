'use strict';

/**
 * Task for registering component to system. Task is expecting 3 arguments,
 * firstly we decide if component should be fetched by npm or should
 * be cloned from repository (we need to have clone access to repository
 * in this case)
 *
 * e.q node ./register_compnent false ocularis-cube git@github.com:cverna-hackathons/ocularis-cube.git
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

/**
 * @IMPORTANT
 * This flag set if data types are created if not exists in DBS.
 * It may be misuse in production environment.
 */
let CREATING_DATA_TYPES = true;

if (!name || !url) {
  console.error('Not provided name or/and url. Exiting.');
  process.exit(1);
}

//we need to fetch module and parse manifest and persist data
let move = (getByNpm == 'true') ? `cd ${moduleDirToSandbox} && rm -rf ${name}` : `cd ${moduleDirToSandboxModules} && rm -rf ${name}`;
let buildCommand = (getByNpm == 'true') ? `npm install --save ${name}` : `git clone ${url}`;
let postbuildCommand = ((getByNpm == 'true') ? `cd node_modules/${name}` : `cd ${name}`) + ` && npm install && npm run build`;
let cmd = `${move} && ${buildCommand} && ${postbuildCommand}`;

console.log('Running: ', cmd);
cProc.exec(cmd, (err) => {
  if (err) {
    console.error(`Couldn\'t fetch the module: ${err}`);
    process.exit(1);
  }

  //at this point we have fetched repo inside sandbox modules
  //now we need to parse its manifest and persist in DBS
  let manifest = require(`${path.resolve(moduleDirToSandboxModules, name, 'ocularis-manifest.json')}`);

  models.Component.find({
    where: {
      name: name,
      url: url
    }
  }).then((component) => {
    if(component)
      updateComponent(component, manifest, resolve)
    else
      createComponent(manifest, resolve);

    function resolve(err) {
      if (err) {
        console.error(err);
        process.exit(1);
      } else {
        console.log(`${name}: Saved.`);
        //final step is to rebuild front-end of app, so
        //new component is available for public
        cProc.exec(`cd ${path.resolve(__dirname, '../')} && npm run build:components`, (err) => {
          if (err) process.exit(1);
          else process.exit(0);
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
function updateComponent(component, manifest, callback) {
  console.log('Updating component...');
  //TODO
  component.destroy({force: true}).then(() => createComponent(manifest, callback));
}

/**
 * Create component and all its relations based on provided manifest.
 * @param  {Object} manifest
 * @return {Promise}
 */
function createComponent(manifest, callback) {
  console.log('Creating component...');

  let allUsedTypes = manifest.fields.reduce((prevVal, f) => {
    return prevVal.concat(f.types);
  }, []);

  models.Component.create({
    libName: manifest.name,
    name: manifest.name,
    url: manifest.url,
    byNpm: getByNpm == 'true'
  }).then((component) => {
    console.log('Component created.');
    findOrCreateAllTypes(allUsedTypes, (err, types) => {
      if (err) { callback(err); }

      let fieldsPromises = manifest.fields.reduce((prevVal, f) => {
        let fieldTypes = types.filter((t) => {
          return f.types.indexOf(t.name) !== -1;
        });
        prevVal.push(_call => {
          let newCF = models.ComponentField.create({
            name: f.name
          }).then((cf) => {
            async.parallel([
              (_c) => cf.setComponent(component).then(() => _c()).catch(err => _c(err)),
              (_c) => cf.setDataTypes(fieldTypes).then(() => _c()).catch(err => _c(err))
            ], (err, results) => _call(err));
          })
          .catch(err => _call(err));
        });
        return prevVal;
      }, []);
      console.log('Creating component fields...');
      async.parallel(fieldsPromises, (err, results) => {
        if (err) {
          callback(err);
        } else {
          callback(null, results);
        }
      })
    });
  }).catch(err => callback(err));
}

function findOrCreateAllTypes(types, resultCallback) {
  let promises = [];
  if (!CREATING_DATA_TYPES) {
    models.DataType.findAll({
      where: {
        name: {
          $in: types
        }
      }
    }).then((results) => resultCallback(null, results))
      .catch(err => resultCallback(err));

    return;
  }

  types.forEach((t) => {
    promises.push(nestedCallback => {
        models.DataType.findOrCreate({
          where: {
            name: t
          }
        }).then((dt) => nestedCallback(null, dt[0]))
        .catch(err => nestedCallback(err))
    });
  });
  async.parallel(promises, (err, results) => {
    resultCallback(err, results);
  });
}
