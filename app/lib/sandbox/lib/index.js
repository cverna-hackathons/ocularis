'use strict';

function sandbox() {
  
  var path      = require('path');
  var fs        = require('fs');
  var async     = require('async');
  var _         = require('underscore');
  var buildDir  = path.resolve(__dirname, '../../../../public/sandbox');

  function createComponentFile(component, done) {
    
    var componentFile = ''

    assignComponentPaths(component);
    async.waterfall([
      next => reinstallComponentPackage(component, next),
      next => getComponentPackageDetails(component, next),
      readHeaderFile,
      (headerFileContent, next) => {
        componentFile = concatenate(componentFile, headerFileContent);
        fs.readFile(component.sourcePath, (err, componentContent) => {
          componentContent  = (buildInjection(component, componentContent));
          componentFile     = concatenate(componentFile, componentContent);
          return next(err, componentFile);
        });
      },
      (componentFile, next) => saveComponentFile(componentFile, component, next)
    ], done);
  }

  function reinstallComponentPackage(component, done) {
    return done();
  }

  function getComponentPackageDetails(component, done) {
    var packageDetails = require(
      path.resolve(component.sourceDir, 'package.json')
    );

    console.log('packageDetails', packageDetails)
    component.packageDetails = packageDetails;
    return done();
  }

  function saveComponentFile(componentFile, component, done) {
    fs.writeFile(component.buildPath, componentFile, done);
  }

  function assignComponentPaths(component) {
    component.sourceDir   = path.resolve(
      __dirname, '../node_modules', component.name
    );
    component.sourcePath  = path.resolve(component.sourceDir, 'dist', 'index.js');
    component.buildPath   = path.resolve(buildDir, component.name + '.js');
    component.publicPath  = ('sandbox/' + component.name + '.js');
    console.log('assignComponentPath | component:', component);
  }

  function buildInjection(component, componentContent) {
    var componentProperties = _.pick(component, ['name', 'publicPath']);

    return (
      '(function() {\n' + 
      'console.log("Loading component: ' + component.name +'");\n' +
      ' var componentProperties = ' + JSON.stringify(componentProperties) + ';\n' +
      ' ' + componentContent + '\n' +
      ' componentProperties._constructor = componentConstructor;\n' +
      // Component content will execute the construction and we will have a 
      // variable of componentConstructor available
      ' window.ocularisComponentConstructors.push(componentProperties);\n' +
      '})();\n'
    );
  }

  function concatenate(content, addition) {
    return (content + addition.toString());
  }

  function readHeaderFile(done) {
    fs.readFile(path.resolve(__dirname, './header.js'), done);
  }

  return {
    createComponentFile: createComponentFile,
    assignComponentPaths: assignComponentPaths
  };
}

module.exports = sandbox;