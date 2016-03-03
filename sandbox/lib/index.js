'use strict';

function sandbox() {
  
  var path      = require('path');
  var fs        = require('fs');
  var async     = require('async');
  var _         = require('underscore');
  var buildDir  = path.resolve(__dirname, '../../public/sandbox')

  function createComponentFile(component, done) {
    
    var componentFile = ''

    assignComponentPaths(component);

    async.waterfall([
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

  function saveComponentFile(componentFile, component, done) {
    fs.writeFile(component.buildPath, componentFile, done);
  }

  function assignComponentPaths(component) {
    component.sourcePath  = path.resolve(
      __dirname, '../node_modules', component.name, 'dist', 'index.js'
    );
    component.buildPath   = (buildDir + '/' + component.name + '.js');
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
      // Component content will execute the construction and we will have a 
      // variable of newComponent available
      ' newComponent.name = "' + component.name + '";\n' +
      ' window.ocularisComponents.push(newComponent);\n' +
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
    createComponentFile: createComponentFile
  };
}

module.exports = sandbox;