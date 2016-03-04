'use strict';

function Light() {
  return new THREE.AmbientLight(0xeeeeee);
}

function Pivot(opt) {
  opt = _.defaults(opt || {}, {
    size: {
      width: .1,
      height: .1,
      depth: .1
    },
    position: {
      x: 0,
      y: -1,
      z: -2.5
    },
    material: new THREE.MeshBasicMaterial({ color: 'red' })
  });

  var geometry = new THREE.CubeGeometry(opt.size.width, opt.size.height, opt.size.depth);
  var box = new THREE.Mesh(geometry, opt.material);

  box.position.x = opt.position.x;
  box.position.y = opt.position.y;
  box.position.z = opt.position.z;

  return box;
}

function loadSettings(done) {
  $.get('/load_settings', function (response) {
    if (response && response.settings) {
      return done(null, response.settings);
    } else return done('Unable to load user configuration.');
  });
}

function Director() {

  /**
   * Initialize the objects in scene
   * @param  {THREE.js scene} object
   * @return {void}
   */
  function init(scene) {

    scene.add(Light());
    // Add basic pivot object to the scene (red box)
    scene.add(Pivot());

    // XXX: Remove after config load
    // var cube = Cube();
    // // Create a bounding box for size assessment
    // var boundingBox = new THREE.Box3().setFromObject(cube.component)

    // XXX: Print out the size of our bounding box
    // scene.add(cube.component);
    // console.log(boundingBox.size())

    addComponents(scene);
  }

  function addComponents(scene) {
    initializeComponentContainers();
    console.log('loading addComponents');
    loadSettings(function (errs, settings) {
      if (!errs) {
        settings.components.forEach(function (component) {
          addComponent(component, scene);
        });
      }
    });
  }

  function initializeComponentContainers() {
    window.ocularisComponents = [];
    window.ocularisComponentConstructors = [];
  }

  function addComponent(component, scene) {
    console.log('addComponents | component:', component);
    if (component.publicPath) {
      $.getScript(component.publicPath, function (data, textStatus, jqxhr) {
        console.log('addComponents | textStatus, jqxhr:', textStatus, jqxhr);
        var componentConstructor = getComponentConstructor(component.name);

        if (typeof componentConstructor === 'function') {
          console.log('found constructor');
          var instance = componentConstructor(component.id || Date.now());
          scene.add(instance.component);
        } else console.warn('Loaded object is not a constructor function!', componentConstructor);
      });
    }
  }

  function getComponentConstructor(name) {
    var hit;
    var constructors = window.ocularisComponentConstructors || [];

    for (var i = 0; i < constructors.length; i++) {
      var candidate = constructors[i];
      console.log('candidate:', candidate);
      if (candidate && candidate.name === name && candidate._constructor) {
        hit = candidate._constructor;
        break;
      }
    }
    return hit;
  }

  return {
    init: init,
    addComponents: addComponents,
    addComponent: addComponent
  };
}

function Scene() {
  return new THREE.Scene();
}

// Render component preview
function Preview(options) {
  var self = {
    update: true
  };
  var director = Director();
  var scene = Scene();
  var renderer = new THREE.WebGLRenderer();
  var width = options.$container.width();
  var height = options.$container.height();
  var camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);

  console.log('preview component | width, height:', width, height);

  scene.add(Light());
  director.addComponent(options.component, scene);
  renderer.setSize(width, height);
  options.$container.html(renderer.domElement);

  // Draw component preview
  var draw = function draw() {
    renderer.render(scene, camera);
    if (self.update) {
      self.update = false;
      requestAnimationFrame(draw);
    }
  };

  draw();
}

$(document).ready(init);

function init() {

  // This will render each component in preview thumbnail
  $('.component-preview').each(function (elemIndex, previewElement) {
    Preview(inferOptionsFrom(previewElement));
  });

  function inferOptionsFrom(previewElement) {
    var $elem = $(previewElement);
    var options = {
      $container: $elem,
      component: {
        id: $elem.attr('data-id'),
        name: $elem.attr('data-name'),
        publicPath: $elem.attr('data-public-path')
      }
    };
    return options;
  }
}
