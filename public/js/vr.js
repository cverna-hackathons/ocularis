'use strict';

/**
 * Moves (NO animation) object to a distance vector (by adding the position and distance vectors)
 * @param  {THREE.Object} object that is to be moved
 * @param  {THREE.Vector3} Distance vector
 * @return {void} 
 */
function moveBy(object, distanceVec) {
  object.position.add(distanceVec);
}

/**
 * Rotates (NO animation) object to given rotation vector
 * @param  {THREE.Object} object that is to be moved
 * @param  {THREE.Vector3} Rotation vector
 * @return {void} 
 */
function rotateBy(object, rotationVec) {
  var rot = object.rotation;

  object.rotation.set(rot.x + rotationVec.x, rot.y + rotationVec.y, rot.z + rotationVec.z);
}

function Scene() {
  return new THREE.Scene();
}

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

var initialDistance = 5;
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

  var objectOnePos = new THREE.Vector3();
  var objectTwoPos = new THREE.Vector3();

  var objectOneRot = objectOne.rotation;
  var objectTwoRot = objectTwo.rotation;

  objectOnePos.setFromMatrixPosition(objectOne.matrixWorld);
  objectTwoPos.setFromMatrixPosition(objectTwo.matrixWorld);

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

var _animations = {};

function Animate(object) {
  var finalCallback = null;
  var interimCallback = null;
  var transforms = [];
  var id = Date.now() + '-' + object.id;

  console.log('init anim');

  var context = {
    id: id,
    start: function start(options) {
      console.log('starting anim');
      transforms.push(animatedTransform(object, options.transformFn, options.deltaVec, options.frameLength));
      _animations[id] = context;
      return context;
    },
    next: function next() {
      var formerLen = transforms.length;

      transforms = transforms.filter(function (transform) {
        return transform.next();
      });
      if (formerLen > transforms.length && typeof interimCallback === 'function') {
        interimCallback(transforms.length);
      }
      return transforms.length > 0;
    },
    interim: function interim(fn) {
      if (typeof fn === 'function') interimCallback = fn;
    },
    complete: function complete() {
      delete _animations[id];
      if (typeof finalCallback === 'function') return finalCallback();
    },
    then: function then(fn) {
      if (typeof fn === 'function') finalCallback = fn;
    }
  };

  return context;
}

function updateAnimations() {
  for (var id in _animations) {
    if (_animations.hasOwnProperty(id)) {
      var anim = _animations[id];
      if (anim.next() === false) {
        anim.complete();
      }
    }
  }
}

/**
 * Transforms (animated) to a vector 
 * (by transforming initial vectors with transform function)
 * @param  {THREE.Object} object that is to be moved
 * @param  {Function} Function that moves, rotates or scales object
 * @param  {THREE.Vector3} Change vector
 * @param  {Integer} Animation frame length
 * @return {Object} Returns iterable object 
 *                  that is used for animation stepping or cancellation 
 */
function animatedTransform(object, transformFn, deltaVec, frameLength) {
  frameLength = frameLength || 60;

  // let initialPosition  = object.position.clone();
  var moveIncrementVec = deltaVec.divideScalar(frameLength);
  var framesLeft = frameLength + 0;
  var animStarted = false;

  return {
    id: parseInt(Math.random() * 10000).toString(),
    object: object,
    started: animStarted,
    next: function next() {
      framesLeft--;
      if (framesLeft > 0) {
        animStarted = true;
        transformFn(object, deltaVec);
        return true;
      } else return false;
    }
    // , cancel: () => object.position.copy(initialPosition)
  };
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

  var _animations = {};

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
    updateAnimations();
  }

  /**
   * Will bind key down on spacebar to activating the component in view
   * @return {void}
   */
  function initializeActivationEvent() {
    _events = _engine.getEvents();
    _events.addEventListener(_settings && _settings.general && _settings.general.activationKey ? _settings.general.activationKey : 'spacebar', toggleComponentActivation, activationID);
  }

  /**
   * Will check the component in view,
   * and align it to a fitting plane visible from camera
   * @return {void}
   */
  function toggleComponentActivation() {
    // Check the instance in view and is not already activated
    // If there is one, check it's view frame distance to camera 
    if (_inView.instance && !_inView.instance._activated) {
      activateComponent();
    } else if (_inView.instance && _inView.instance._activated) {
      deactivateComponent(_inView.instance);
    } else console.log('No component in view.');
  }

  /**
   * Align component to a fitting plane visible from camera, move and rotate
   * @return {void}
   */
  function activateComponent() {
    var component = _inView.instance.component;
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

    component.updateMatrixWorld();
    // Get the distance and rotation relations between fitting plane and frame
    var transformRelation = getTransformRelation(_inView.instance.frame, fittingPlane, 1);

    // Negate on the z axis, since we are coming closer to camera
    transformRelation.distanceVec.z *= -1;

    Animate(component).start({
      deltaVec: transformRelation.distanceVec, transformFn: moveBy
    }).start({
      deltaVec: transformRelation.rotationVec, transformFn: rotateBy
    }).then(function () {
      console.log('animation move ended.');
    });

    _inView.instance._activated = true;
    console.log('transformRelation:', transformRelation);

    renderActivationData();
    setTimeout(function () {
      return _scene.remove(fittingPlane);
    }, 3000);
  }

  function renderActivationData() {
    // Get initial data from provider
    // Render it to drawables
    _inView.instance.draw([{
      drawableId: 'main',
      content: 'Initial main text for instance of ' + _inView.instance.id + '.',
      type: 'text',
      bgColor: 'rgba(100, 100, 100, 0.5)',
      textColor: '#ffffff'
    }]);
  }

  /**
   * Reset component arrangement to initial position
   * @param  {Object} Component instance to rearrange
   * @return {void}
   */
  function deactivateComponent(instance) {
    instance.deactivate();
    instance._activated = false;
    arrangeComponent(instance, true);
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
    if (component.publicPath) {
      $.getScript(component.publicPath, function (data, textStatus, jqxhr) {
        var componentConstructor = getComponentConstructor(component.name);

        if (typeof componentConstructor === 'function') {
          var instance = componentConstructor(component.id || Date.now());
          // Assign order index, will be reused by arrangement
          instance.idx = component.idx;
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
  function arrangeComponent(instance, animated) {
    var idx = instance.idx;
    var arrangement = componentArrangementMap[idx];

    console.log('idx, arrangement:', idx, arrangement, window.ocularisComponents);
    if (arrangement) {
      var pos = arrangement.position.clone();
      var rot = arrangement.rotation.clone();

      if (animated) {
        Animate(instance.component).start({
          transformFn: moveBy,
          deltaVec: pos
        });
      } else {
        instance.component.position.copy(pos);
      }
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

function Renderer() {
  var renderer = new THREE.WebGLRenderer({});
  renderer.setPixelRatio(window.devicePixelRatio);

  return renderer;
}

function Draw(engine, scene, camera, VRHandlers, renderer) {

  return function draw(timeStamp) {
    requestAnimationFrame(draw);

    if (engine.getVREnabled()) {
      VRHandlers.VRControls.update();
      VRHandlers.VRManager.render(scene, camera, timeStamp);
      VRHandlers.VREffect.render(scene, camera);
      engine.update();
    } else {
      engine.update();
      if (engine.getFrameUpdate()) {
        engine.setFrameUpdate(false);
        renderer.render(scene, camera);
      }
    }
  };
}

function Camera() {

  var config = {
    FOV: 75,
    CUTOFF: 0.1,
    ASPECT_RATIO: window.innerWidth / window.innerHeight,
    TARGET_DISTANCE: 10000
  };

  return new THREE.PerspectiveCamera(config.FOV, config.ASPECT_RATIO, config.CUTOFF, config.TARGET_DISTANCE);
}

function View(engine) {

  function reset() {
    engine.setCamera(Camera());
    engine.setFrameUpdate(true);

    if (engine.getVREnabled()) {
      engine.enableVR();
    } else {
      engine.disableVR();
    }
  }

  return {
    reset: reset
  };
}

function Events() {
  var listeners = {};

  function getEventKeyDirection(event, trigger) {
    console.log('getEventKeyDirection | event.keyCode:', event.keyCode, trigger);
    var key;
    switch (event.keyCode) {
      // W-key
      // ArrowUp
      case 38:
        key = 'forward';
        break;
      // ArrowDown
      case 40:
        key = 'backward';
        break;
      // ArrowLeft
      case 37:
        key = 'left';
        break;
      // ArrowRight
      case 39:
        key = 'right';
        break;
      // Spacebar press
      case 32:
        key = 'spacebar';
        break;
      case 13:
        key = 'enter';
        break;
      case 90:
        key = 'z';
        break;
    }
    return key;
  }

  function trackKeys(event) {
    triggerKeyEvent(getEventKeyDirection(event, 'keydown'));
  }

  function setTriggers() {
    $('body').on('keydown', trackKeys);
  }

  function triggerKeyEvent(key) {
    if (listeners[key]) listeners[key].forEach(function (obj) {
      return obj.callback();
    });
  }

  function addEventListener(key, done, id) {
    if (!listeners[key]) listeners[key] = [];
    id = id || Date.now();
    listeners[key].push({ callback: done, id: id });
    return id;
  }

  function removeEventListener(id) {
    for (var key in listeners) {
      for (var i = 0, len = listeners[key].length; i < len; i++) {
        if (listeners[key][i].id === id) {
          listeners[key].splice(i, 1);
        }
      }
    }
  }

  setTriggers();

  return {
    getListeners: function getListeners() {
      return listeners;
    },
    addEventListener: addEventListener,
    removeEventListener: removeEventListener
  };
}

function VRHandlers_(camera, renderer) {

  var VRControls = new THREE.VRControls(camera);
  var VREffect = new THREE.VREffect(renderer);
  var VRManager = new WebVRManager(renderer, VREffect, {
    hideButton: false,
    isUndistorted: false
  });

  // UNTESTED: Moved after VRManager declaration
  VREffect.setSize(window.innerWidth, window.innerHeight);

  return {
    VRControls: VRControls,
    VREffect: VREffect,
    VRManager: VRManager,
    disable: function disable() {
      this.VRControls = null;
      this.VREffect = null;
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  };
}

function Engine() {

  var context = this;

  var models = [];

  var VREnabled = true;

  var scene = Scene();

  var renderer = Renderer();

  var view = null;

  var events = null;

  var VRHandlers = null;

  var frameUpdate = true;

  var camera = null;

  var director = null;

  function init() {
    view = View(this);
    events = Events();
    director = Director(this);
    director.init(scene);

    return this;
  }

  function draw() {
    Draw(this, scene, camera, VRHandlers, renderer)();
  }

  function switchVR() {
    VREnabled = !VREnabled;
    view.reset();
  }

  function enableVR() {
    VRHandlers = VRHandlers_(camera, renderer);
  }

  function resetVRSensor() {
    VRHandlers.VRControls.resetSensor();
  }

  function disableVR() {
    if (VRHandlers) {
      VRHandlers.disable();
    }
  }

  function update() {
    director.checkForUpdates();
  }

  function getVREnabled() {
    return VREnabled;
  }

  function getFrameUpdate() {
    return frameUpdate;
  }

  function setFrameUpdate(bool) {
    frameUpdate = bool;
  }

  function setCamera(_camera) {
    camera = _camera;
  }

  function getRenderer() {
    return renderer;
  }

  function getScene() {
    return scene;
  }

  function getCamera() {
    return camera;
  }

  function getView() {
    return view;
  }

  function getEvents() {
    return events;
  }

  return {
    init: init,
    draw: draw,
    switchVR: switchVR,
    enableVR: enableVR,
    disableVR: disableVR,
    update: update,
    getVREnabled: getVREnabled,
    getFrameUpdate: getFrameUpdate,
    setFrameUpdate: setFrameUpdate,
    setCamera: setCamera,
    getRenderer: getRenderer,
    getView: getView,
    getCamera: getCamera,
    getScene: getScene,
    getEvents: getEvents
  };
}

function init() {
  var engine = Engine().init();

  WebVRConfig = {
    ORCE_ENABLE_VR: false
  };

  $('#scene').html(engine.getRenderer().domElement);
  engine.getView().reset();
  engine.draw();
}

$(document).ready(init);
