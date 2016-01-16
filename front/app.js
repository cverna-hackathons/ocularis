var scene = require('./scene');
var renderer = require('./renderer');
var camera = require('./camera');
var light = require('./light');
var draw = require('./draw')(camera, renderer, scene);

var box = require('./models/box');

document.body.appendChild(renderer.domElement);

var bb = box();

scene.add(bb);
scene.add(light);
draw();

