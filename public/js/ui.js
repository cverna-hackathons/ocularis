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

function Arrow(camera) {
  return new THREE.ArrowHelper(camera.getWorldDirection(), camera.getWorldPosition(), 1, 0x00ff00);
}

/**
 * Return fitting plane properties
 * @param  {Object THREE.Plane} Frame that bounds the object viewable area
 * @param  {Object THREE.Camera} Scene camera object
 * @return {Object object: THREE.Plane, zDistance: Float} Plane that is scaled 
 *         to our component frame and zDistance that gives us distance from camera
 *         in which we can see the component fit into view
 * 
 */
function Plane(frame, camera) {
  var cameraAspect = camera.aspect;
  var frameParams = frame.geometry.parameters;
  var cameraLookAt = new THREE.Vector3(0, 0, -1);
  var frameAspect = frameParams.width / frameParams.height;
  var fovRad = Math.PI / 180 * camera.fov;
  var hFovRad = fovRad * cameraAspect;
  var cameraWider = cameraAspect > frameAspect;
  var frameWidth = cameraWider ? frameParams.height * cameraAspect : frameParams.width;
  var frameHeight = cameraWider ? frameParams.height : frameParams.width * cameraAspect;
  var fittingPlane = new THREE.Mesh(new THREE.PlaneGeometry(frameWidth, frameHeight), new THREE.MeshBasicMaterial({ color: '#00ff00', wireframe: true }));

  return {
    object: fittingPlane,
    zDistance: frameWidth / (2 * Math.tan(hFovRad / 2))
  };
}

var initialDistance = 2.5;
var angleShift = Math.PI / 180 * 36;
var xShift = Math.sin(angleShift) * initialDistance;
var zShift = Math.cos(angleShift) * -initialDistance;
// Serves to place and rotate the component instances into sectors
// of ?semi-dodecahedron (6 max for now?), may want to generate this later
var componentArrangementMap = [
// Initial front facing position
{
  position: new THREE.Vector3(0, 0, -initialDistance),
  rotation: new THREE.Vector3(0, 0, 0)
},
// Front left
{
  position: new THREE.Vector3(xShift, 0, zShift),
  rotation: new THREE.Vector3(0, -angleShift, 0)
},
// Front right
{
  position: new THREE.Vector3(-xShift, 0, zShift),
  rotation: new THREE.Vector3(0, angleShift, 0)
}];

/**
 * Get the standard camera vector looking down the z axis
 * @return {THREE.Vector3} Camera initial lookat vector
 */
function cameraLookAt() {
  return new THREE.Vector3(0, 0, -1);
}

/**
 * Returns object containing information about the distance
 * between two objects, relative closeness boolean, and rotation delta
 * based on provided vicinity argument
 * @param  {[type]} objectOne [THREE.js object]
 * @param  {[type]} objectTwo [THREE.js object]
 * @param  {[type]} vicinity  [Defines in distance what is considered near]
 * @return {Object}           Returns object with info about distance, rotation between 
                              the objects
 */
function getTransformRelation(objectOne, objectTwo, vicinity) {

  var relation = {};

  var objectOnePos = objectOne.position;
  var objectTwoPos = objectTwo.position;

  var objectOneRot = objectOne.rotation;
  var objectTwoRot = objectTwo.rotation;

  var distanceVec = new THREE.Vector3(objectOnePos.x - objectTwoPos.x, objectOnePos.y - objectTwoPos.y, objectOnePos.z - objectTwoPos.z);
  var rotationVec = new THREE.Vector3(objectOneRot.x - objectTwoRot.x, objectOneRot.y - objectTwoRot.y, objectOneRot.z - objectTwoRot.z);

  relation.distanceVec = distanceVec;
  relation.rotationVec = rotationVec;
  relation.distance = objectOnePos.distanceTo(objectTwoPos);
  relation.isClose = relation.distance < vicinity;

  return relation;
}

function loadSettings(done) {
  $.get('/load_settings', function (response) {
    if (response && response.settings) {
      return done(null, response.settings);
    } else return done('Unable to load user configuration.');
  });
}

function moveTo(object, distanceVec) {
  object.position.add(distanceVec);
}

function rotateTo(object, rotationVec) {
  object.rotation.copy(rotationVec);
}

function Director(engine) {
  // Track the camera and scene objects
  // Also add a helper arrow to see what objects camera is directly looking at
  // Add raycaster object to find intersects for the above
  var _scene = undefined,
      _camera = undefined,
      _arrow = undefined,
      _raycaster = undefined,
      _events = undefined,
      _settings = undefined;
  // Create a shared object to assign instance in view
  var _inView = {};

  var _engine = engine;

  var _previewMode = false;

  var selectedColor = '#ff0000';
  var unselectedColor = '#eeeeee';
  var activationID = 'componentActivation';

  /**
   * Initialize the objects in scene
   * @param  {THREE.js scene} object
   * @return {void}
   */
  function init(scene) {
    _scene = scene;
    // Initialize raycaster in order to calculate intersections
    _raycaster = new THREE.Raycaster();
    // Add our ambient light to scene   
    _scene.add(Light());
    // Add basic pivot object to the scene (red box)
    _scene.add(Pivot());
    // Empty component container arrays
    initializeComponentContainers();
    // Add components to scene
    addComponents(initializeActivationEvent);
    // Return for chaining
    return this;
  }

  /**
   * Initialize the objects in scene for preview on settings page, 
   * also sets the preview mode to true
   * @param  {THREE.js scene} object
   * @param  {THREE.js camera} object
   * @return {void}
   */
  function initPreview(scene, camera) {
    _scene = scene;
    _camera = camera;
    _previewMode = true;
  }

  /**
   * Called each frame from outside to check and mark updates to scene
   * @return {void}
   */
  function checkForUpdates() {
    selectComponentInView();
  }

  /**
   * Will bind key down on spacebar to activating the component in view
   * @return {void}
   */
  function initializeActivationEvent() {
    _events = _engine.getEvents();
    _events.addEventListener(_settings && _settings.general && _settings.general.activationKey ? _settings.general.activationKey : 'spacebar', activateComponentInView, activationID);
  }

  /**
   * Will check the component in view,
   * and align it to a fitting plane visible from camera
   * @return {void}
   */
  function activateComponentInView() {
    // Check the instance in view and is not already activated
    // If there is one, check it's view frame distance to camera 
    if (_inView.instance && !_inView.instance.activated) {
      (function () {
        var fitting = Plane(_inView.instance.frame, _camera);
        var fittingPlane = fitting.object;
        var _cameraLookAt = cameraLookAt();
        var cameraPos = _camera.position;
        var shiftVector = _cameraLookAt.applyQuaternion(_camera.quaternion).multiplyScalar(fitting.zDistance);

        // Add the dummy fitting plane to scene
        _scene.add(fittingPlane);
        // Move and rotate the fitting plane
        fittingPlane.position.addVectors(cameraPos, shiftVector);
        fittingPlane.rotation.copy(_camera.rotation);

        console.log('shiftVector:', shiftVector);
        console.log('fitting:', fitting);
        console.log('_inView', _inView);

        // Get the distance and rotation relations between fitting plane and frame
        var transformRelation = getTransformRelation(_inView.instance.frame, fittingPlane, 1);

        moveTo(_inView.instance.component, transformRelation.distanceVec);
        rotateTo(_inView.instance.component, transformRelation.rotationVec);
        _inView.instance.activated = true;
        console.log('transformRelation:', transformRelation);

        setTimeout(function () {
          return _scene.remove(fittingPlane);
        }, 3000);
      })();
    }
  }

  /**
   * Will select the component we are looking at directly
   * @return {void}
   */
  function selectComponentInView() {
    // Check which component am I looking at
    // Only capture objects that are no further than 100
    _inView.distance = 100;
    _inView.instance = null;
    _camera = engine.getCamera();
    // Show arrow helper in the middle of view
    if (_arrow) _scene.remove(_arrow);
    _scene.add(Arrow(_camera));
    // Send a ray through the middle of camera view
    _raycaster.setFromCamera({ x: 0, y: 0 }, _camera);
    // Get the component frames intersecting the ray
    window.ocularisComponents.forEach(function (instance, instanceIdx) {
      var intersections = _raycaster.intersectObject(instance.frame);

      // Get the closest component in intersection
      if (intersections.length && intersections[0].distance < _inView.distance) {
        _inView.distance = intersections[0].distance;
        _inView.instance = instance;
      }
    });
    highlightSelection();
  }

  /**
   * Checks the _inView variable selects the instance in view, 
   * This will color the instance as highlighted is used for later events
   * @return {void}
   */
  function highlightSelection() {
    window.ocularisComponents.forEach(function (instance) {
      if (_inView.instance && instance.id === _inView.instance.id) {
        _inView.instance.frame.material.color.set(selectedColor);
      } else instance.frame.material.color.set(unselectedColor);
    });
  }

  /**
   * Loads settings and component definitions, then adds the components to scene
   * @param  {function} Callback when all component additions were initiated
   * @return {void}
   */
  function addComponents(done) {
    loadSettings(function (errs, settings) {
      if (!errs) {
        _settings = settings;
        settings.components.forEach(function (component, componentIdx) {
          component.idx = componentIdx;
          addComponent(component);
        });
        if (done) return done();
      } else console.warn('Unable to load settings! [Error:', errs, ']');
    });
  }

  /**
   * Called on start to empty containers for component constructors and instances
   * @return {void}
   */
  function initializeComponentContainers() {
    initComponents();
    initComponentConstructors();
  }

  /**
   * Empties the array into which component instances will be pushed
   * @return {void}
   */
  function initComponents() {
    window.ocularisComponents = new Array();
  }

  /**
   * Empties the array of component constructors,
   * which get loaded with the component script files
   * @return {void}
   */
  function initComponentConstructors() {
    window.ocularisComponentConstructors = new Array();
  }

  /**
   * Loads the component script and adds it to scene
   * If director is in preview mode, component is activated automatically
   * If director is NOT in preview mode, component is arranged
   * @param  {object} Component attributes
   * @param  {function} OPTIONAL: Callback for when the adding is complete
   * @return {void}
   */
  function addComponent(component, done) {
    console.log('addComponent, _previewMode:', _previewMode);
    if (component.publicPath) {
      $.getScript(component.publicPath, function (data, textStatus, jqxhr) {
        var componentConstructor = getComponentConstructor(component.name);

        if (typeof componentConstructor === 'function') {
          var instance = componentConstructor(component.id || Date.now());
          // If component is in preview, do not add to global
          // in order to prevent displacement in preview
          _scene.add(instance.component);
          if (!_previewMode) {
            arrangeComponent(instance);
          } else {
            _inView.instance = instance;
            activateComponentInView();
          }
        } else console.warn('Loaded object is not a constructor function!', componentConstructor);
        // Add callback so that we know when have we added the component to scene
        if (done) return done();
      });
    } else if (done) return done();
  }

  /**
   * Arranges component according to it's order in scene
   * @param  {instance: Object} Component instance
   * @return {void}
   */
  function arrangeComponent(instance) {
    var idx = window.ocularisComponents.length;
    var arrangement = componentArrangementMap[idx];

    console.log('idx, arrangement:', idx, arrangement, window.ocularisComponents);
    if (arrangement) {
      var pos = arrangement.position;
      var rot = arrangement.rotation;

      instance.component.position.copy(pos);
      instance.component.rotation.set(rot.x, rot.y, rot.z);
      window.ocularisComponents.push(instance);
    }
  }

  /**
   * Retrieves the component constructor from global array
   * @param  {name: String} 
   * @return {function} Component constructor function
   */
  function getComponentConstructor(name) {
    var _constructor;
    var constructors = window.ocularisComponentConstructors || [];

    for (var i = 0; i < constructors.length; i++) {
      var candidate = constructors[i];

      if (candidate && candidate.name === name && candidate._constructor) {
        _constructor = candidate._constructor;
        break;
      }
    }
    return _constructor;
  }

  return {
    init: init,
    initPreview: initPreview,
    addComponents: addComponents,
    addComponent: addComponent,
    initComponents: initComponents,
    checkForUpdates: checkForUpdates
  };
}

function Scene() {
  return new THREE.Scene();
}

// Render component preview
function Preview(options) {
  var self = { update: true };
  var scene = Scene();
  var director = Director();
  var renderer = new THREE.WebGLRenderer();
  var $container = options.$container;
  var width = $container.width();
  var height = $container.height();
  var camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);

  director.initPreview(scene, camera);
  options.component.preview = true;
  scene.add(Light());
  director.addComponent(options.component, function () {
    return self.update = true;
  });
  renderer.setSize(width, height);
  $container.html(renderer.domElement);

  // Draw component preview
  var draw = function draw() {
    requestAnimationFrame(draw);
    if (self.update) {
      self.update = false;
      renderer.render(scene, camera);
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
