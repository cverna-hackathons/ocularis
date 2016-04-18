'use strict';

function Scene() {
  return new THREE.Scene();
}

function Light() {
  return new THREE.AmbientLight(0xeeeeee);
}

// Sets the scene background
function Background(options, engine, done) {

  options = options || {
    bgPath: 'images/backdrop_desert.jpg',
    radius: 50,
    hCutOff: 0,
    vCutOff: 1,
    resolution: 20
  };

  if (options.bgPath) {
    loadEquirectangularTexture(done);
  } else if (options.color) {
    engine.getRenderer().setClearColor(options.color, 1);
    return done();
  }

  /**
   * Once texture for background is loaded, assign it as mapping to the material
   * @param  {THREE.Texture} texture - Texture loaded
   * @return {Function execution} next - callback executed
   */
  function loadEquirectangularTexture(next) {
    var texLoader = new THREE.TextureLoader();
    var material = new THREE.MeshBasicMaterial({ side: THREE.BackSide });
    var sphere = new THREE.SphereGeometry(options.radius, options.resolution, options.resolution);
    var backdrop = new THREE.Mesh(sphere, material);

    texLoader.load(options.bgPath, function (texture) {
      material.map = texture;
      texture.needsUpdate = true;
      return next(backdrop);
    });
  }
}

function Arrow(camera) {
  return new THREE.ArrowHelper(camera.getWorldDirection(), camera.getWorldPosition(), 1, 0x00ff00);
}

/**
 * Return fitting plane properties
 * @param  {Object THREE.Mesh} Frame that bounds the object viewable area
 * @param  {Object THREE.Camera} Scene camera object
 * @return {Object object: THREE.Plane, zDistance: Float} Plane that is scaled 
 *         to our component frame and zDistance that gives us distance from camera
 *         in which we can see the component fit into view
 * 
 */
function Plane(frame, camera) {

  frame.updateMatrixWorld();

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

  fittingPlane.name = 'fittingPlane';

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

/** Returns distance between two objects
 * @param  {[type]} objectOne [THREE.js object]
 * @param  {[type]} objectTwo [THREE.js object]
 * @return {Float} distance - between the two provided objects
 */
function distanceBetween(objectOne, objectTwo) {
  return objectOne.position.distanceTo(objectTwo.position);
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
function getTransformRelation(objectOne, objectTwo) {

  objectOne.updateMatrixWorld();
  objectTwo.updateMatrixWorld();

  var relation = {};

  var objectOnePos = objectOne.position.clone();
  var objectTwoPos = objectTwo.position.clone();

  var objectOneRot = new THREE.Euler();
  var objectTwoRot = new THREE.Euler();

  var oneQuaternion = new THREE.Quaternion();
  var twoQuaternion = new THREE.Quaternion();

  oneQuaternion.setFromRotationMatrix(objectOne.matrixWorld);
  twoQuaternion.setFromRotationMatrix(objectTwo.matrixWorld);

  objectOnePos.setFromMatrixPosition(objectOne.matrixWorld);
  objectTwoPos.setFromMatrixPosition(objectTwo.matrixWorld);

  objectOneRot.setFromQuaternion(oneQuaternion);
  objectTwoRot.setFromQuaternion(twoQuaternion);

  var distanceVec = objectOnePos.sub(objectTwoPos);
  var rotationVec = objectOneRot.toVector3().sub(objectTwoRot.toVector3());

  relation.distanceVec = distanceVec;
  relation.rotationVec = rotationVec;
  relation.distance = objectOnePos.distanceTo(objectTwoPos);

  return relation;
}

function loadSettings(done) {
  $.get('/load_settings', function (response) {
    if (response && response.settings) {
      return done(null, response.settings);
    } else return done('Unable to load user configuration.');
  });
}

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
  var rot = object.rotation.toVector3();
  rot.addVectors(rot, rotationVec);
  object.rotation.setFromVector3(rot);
}

var _animations = {};

/**
 * Object animation setup function 
 * @param  {THREE.Object} object that is to be animated
 * @return {Object} Returns iterable object 
 *                  that is used for animation stepping or cancellation 
 */
function Animate(object) {

  var finalCallback = null;
  var interimCallback = null;
  var transforms = [];
  var id = Date.now() + '-' + object.id;

  object.updateMatrixWorld();

  var context = {
    object: object,
    id: id,
    start: function start(options) {
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
      if (typeof finalCallback === 'function') return finalCallback();
    },
    then: function then(fn) {
      if (typeof fn === 'function') finalCallback = fn;
    }
  };

  return context;
}

/**
 * Nudges all registered animations 
 * @return {void}
 */
function updateAnimations() {
  for (var id in _animations) {
    if (_animations.hasOwnProperty(id)) {
      var anim = _animations[id];
      if (anim.next() === false) {
        anim.complete();
        delete _animations[anim.id];
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
  frameLength = frameLength || 20;

  // let initialPosition  = object.position.clone();
  var increment = deltaVec.divideScalar(frameLength);
  var framesLeft = frameLength + 0;

  return {
    id: parseInt(Math.random() * 10000).toString(),
    object: object,
    next: function next() {
      if (framesLeft > 0 && deltaVec.length() !== 0) {
        transformFn(object, increment);
        framesLeft--;
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
      _settings = undefined,
      _fitting = undefined,
      _debug = undefined;
  // Create a shared object to assign instance in view
  var _inView = {};
  var _engine = engine;
  var _previewMode = false;
  var _VRDevicesPresent = false;

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
    // Empty component container arrays
    initComponentContainers();
    // Add components to scene
    addComponents(initEvents);
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
    updateComponents();
  }

  /**
   * Called each frame from outside to check and mark updates to components
   * @return {void}
   */
  function updateComponents() {
    window.ocularisComponents.forEach(function (instance) {
      if (typeof instance.update === 'function') instance.update();
    });
  }

  /**
   * Will bind key down on spacebar to activating the component in view
   * @return {void}
   */
  function initEvents() {
    _debug = _settings.debug;
    _events = _engine.getEvents();
    _events.addEventListeners(_settings && _settings.events && _settings.events.activationKeys ? _settings.events.activationKeys : 'spacebar', toggleComponentActivation, activationID);
    _engine.VRDevicePresent(function (present) {
      _VRDevicesPresent = present;
    });
  }

  /**
   * Will check the component in view,
   * and align it to a fitting plane visible from camera
   * @return {void}
   */
  function toggleComponentActivation() {
    // XXX: just changing rotation for testing
    if (!_VRDevicesPresent) {
      _camera.rotation.z += Math.PI / 180 * 2;
      _camera.rotation.y += Math.PI / 180 * 2;
      _camera.position.x -= .1;
    }

    var instanceInView = _inView.instance;

    if (_inView.instance && !_inView.instance._noEvents) {
      // Check the instance in view and is not already activated
      // If there is one, check it's view frame distance to camera
      if (!instanceInView._activated) {
        window.ocularisComponents.forEach(function (instance) {
          if (instanceInView.id === instance.id) {
            instance._noEvents = true;
            activateComponent(instance, function () {
              instance._noEvents = false;
            });
          } else if (instance._activated) {
            instance._noEvents = true;
            deactivateComponent(instance, function () {
              instance._noEvents = false;
            });
          }
        });
      } else if (instanceInView._activated) {
        instanceInView._noEvents = true;
        deactivateComponent(instanceInView, function () {
          instanceInView._noEvents = false;
        });
      }
    } else console.log('No component in view or no events allowed.');
  }

  function setFitting(instance) {
    _camera.updateMatrixWorld();
    _fitting = Plane(instance.frame, _camera);
    // Update transform matrix according to world,
    // so we get the correct transform relation

    var fittingPlane = _fitting.object;
    var _cameraLookAt = _camera.getWorldDirection();
    var cameraPos = _camera.position.clone();
    var shiftVector = _cameraLookAt.multiplyScalar(_fitting.zDistance);

    // Add the dummy fitting plane to scene
    _scene.add(fittingPlane);
    // Move and rotate the fitting plane
    fittingPlane.position.copy(cameraPos.add(shiftVector));
    fittingPlane.rotation.copy(_camera.rotation);
    console.log('shiftVector, _camera.rotation, _cameraLookAt:', shiftVector, _camera.rotation, _cameraLookAt);
    console.log('_fitting:', _fitting);

    setTimeout(function () {
      return _scene.remove(fittingPlane);
    }, 10);
  }

  /**
   * Align component to a fitting plane visible from camera, move and rotate
   * @return {void}
   */
  function activateComponent(instance, done) {
    var component = instance.component;

    console.log('_inView', _inView);

    // component.updateMatrixWorld();
    // Set up fitting for animation
    setFitting(instance);
    // Get the distance and rotation relations between fitting plane and frame
    var transformRelation = getTransformRelation(instance.frame, _fitting.object, 1);
    // Negate on the z axis, since we are coming closer to camera
    transformRelation.distanceVec.negate();
    transformRelation.rotationVec.negate();

    Animate(component).start({ deltaVec: transformRelation.distanceVec, transformFn: moveBy }).start({ deltaVec: transformRelation.rotationVec, transformFn: rotateBy }).then(function () {
      renderActivated(instance);

      if (done) return done();
    });

    console.log('transformRelation:', transformRelation);
  }

  /**
   * Render component activation
   * @param  {Object} instance - Component instance to render data to 
   * @return {void}
   */
  function renderActivated(instance) {
    // Mark instance as activated
    instance._activated = true;
    // Get initial data from provider
    // Render it to drawables
    instance.draw([{
      drawableId: 'leftSide',
      content: 'images/sample_image_for_leftside.jpg',
      type: 'image'
    }, {
      drawableId: 'main',
      content: 'text',
      type: 'text'
    }, {
      drawableId: 'rightSide',
      content: 'Webcam video for webcam is loaded to the left.',
      type: 'text'
    }]);
  }

  /**
   * Reset component arrangement to initial position
   * @param  {Object} instance - Component instance to rearrange
   * @param  {Function} done - Callback
   * @return {void}
   */
  function deactivateComponent(instance, done) {
    instance.deactivate();
    instance._activated = false;
    arrangeComponent(instance, true, done);
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
    if (!_camera) _camera = engine.getCamera();
    // Show arrow helper in the middle of view
    if (_debug) addViewHelper(_scene);
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
  }

  // Adds arrow in direction of camera view
  function addViewHelper() {
    if (_arrow) _scene.remove(_arrow);
    _arrow = Arrow(_camera);
    _scene.add(_arrow);
  }

  /**
   * Checks the _inView variable selects the instance in view, 
   * This will color the instance as highlighted is used for later events
   * @return {void}
   */
  function highlightSelection() {
    window.ocularisComponents.forEach(function (instance) {
      if (typeof _inView.instance.highlight === 'function') {
        var isInView = instance.id === _inView.instance.id;
        _inView.instance.highlight(isInView);
      }
    });
  }

  /**
   * Loads settings and component definitions, then adds the components to scene
   * @param  {Function} done - when all component additions were initiated
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
        Background(settings.background, _engine, function (bg) {
          if (bg) _scene.add(bg);
          if (done) return done();
        });
      } else console.warn('Unable to load settings! [Error:', errs, ']');
    });
  }

  /**
   * Called on start to empty containers for component constructors and instances
   * @return {void}
   */
  function initComponentContainers() {
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
          var instance = componentConstructor(component.id || Date.now(), _debug);
          // Assign order index, will be reused by arrangement
          instance.idx = component.idx;
          // If component is in preview, do not add to global
          // in order to prevent displacement in preview
          _scene.add(instance.component);
          if (!_previewMode) {
            arrangeComponent(instance);
            window.ocularisComponents.push(instance);
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
   * @param  {Object} Component instance
   * @param  {Boolean} If this arrangement is to be animated
   * @param  {Boolean} If this arrangement is to be animated
   * @return {void}
   */
  function arrangeComponent(instance, animated, done) {
    var idx = instance.idx;
    var component = instance.component;
    var arrangement = componentArrangementMap[idx];

    if (arrangement) {
      var pos = arrangement.position.clone();
      var rot = arrangement.rotation.clone();

      console.log('arrangeComponent, arrangement:', arrangement);
      if (animated) {
        var deltaPos = pos.sub(component.position);
        var deltaRot = rot.sub(component.rotation);

        Animate(component).start({ transformFn: moveBy, deltaVec: deltaPos }).start({ transformFn: rotateBy, deltaVec: deltaRot }).then(finalize);
      } else {
        component.rotation.setFromVector3(rot);
        component.position.copy(pos);
        return finalize();
      }
    }

    function finalize() {
      if (done) return done();
    }
  }

  /**
   * Retrieves the component constructor from global array
   * @param  {String} name - Component name 
   * @return {Function} Component constructor function
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
  var renderer = new THREE.WebGLRenderer({ alpha: true });
  // renderer.setPixelRatio(window.devicePixelRatio);

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
    TARGET_DISTANCE: 500
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

  // Event listeners container
  var listeners = {};

  /**
   * Maps the key name per keyboard event's key code
   * @param  {Object} event - Keydown event
   * @return {String} key - Key name
   */
  function getKeyboardEventKey(event) {
    var key = undefined;
    switch (event.keyCode) {
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
      default:
        key = event.keyCode;
    }
    return key;
  }

  /**
   * Trigger listener callback bound to keyboard event listener 
   * @param  {Object} event - Keyboard event
   * @return {void}
   */
  function triggerKeyboardEvent(event) {
    triggerEvent(getKeyboardEventKey(event), event);
  }

  /**
   * Trigger listener callback bound to leap event listener 
   * @param  {Object} event - Leap event
   * @param  {Object} options - Event's additional options
   * @return {void}
   */
  function triggerLeapEvent(event, options) {
    triggerEvent(options.name, options);
  }

  /**
   * Trigger listener callback, if any bound 
   * @param  {Object} key - Key name for the triggering event
   * @param  {Object} options - Event's additional options
   * @return {void}
   */
  function triggerEvent(key, options) {
    if (listeners[key]) listeners[key].forEach(function (obj) {
      return obj.callback(options);
    });
  }

  // Set up listening to keyboard events
  function setKeyTriggers() {
    $('body').on('keydown', triggerKeyboardEvent);
  }

  // Set up listening to leap events
  function setLeapTriggers() {
    $('body').on('leapEvent', triggerLeapEvent);
  }

  /**
   * Add listeners for events with common callback 
   * @param  {Object|String} keys - Key names for the triggering event
   * @param  {Function} callback - Trigger callback for event
   * @return {Array} ids - IDs of the event listeners created
   */
  function addEventListeners(keys, callback) {
    var ids = [];

    if (keys instanceof Array) {
      ids = keys.map(function (key) {
        return addEventListener(key, callback);
      });
    } else if (typeof keys === 'string') {
      ids.push(addEventListener(keys, callback));
    }
    console.log('addEventListeners | ids:', ids);
    return ids;
  }

  /**
   * Add listener for event 
   * @param  {String} key - Key name for the triggering event
   * @param  {Function} callback - Trigger callback for event
   * @param  {String} [id] - Listener ID (concatenation of key name and time integer)
   * @return {String} id - ID of the event listener created
   */
  function addEventListener(key, callback, id) {
    if (!listeners[key]) listeners[key] = [];
    id = id || [key, Date.now()].join('-');
    listeners[key].push({ callback: callback, id: id });
    return id;
  }

  // Removes event listener, found by id
  function removeEventListener(id) {
    for (var key in listeners) {
      for (var i = 0, len = listeners[key].length; i < len; i++) {
        if (listeners[key][i].id === id) {
          listeners[key].splice(i, 1);
        }
      }
    }
  }

  // Run from engine, sets up all the triggers
  function init() {
    setKeyTriggers();
    setLeapTriggers();
  }

  return {
    getListeners: function getListeners() {
      return listeners;
    },
    addEventListener: addEventListener,
    addEventListeners: addEventListeners,
    removeEventListener: removeEventListener,
    init: init
  };
}

function LeapController(_engine) {
  // What distance is considered to be close between finger tips
  // Used for pointer events
  var tipVicinity = 0.03;
  // Leap adds elements to scene within different scale factor, we will use this
  // custom scale factor to divide the position vectors in order to place pointers
  // to the scene properly
  var scaleFactor = 700;
  // Delay between registering the same leap event
  var eventDelay = 700;
  // Finger name to index map
  var fingerNameMap = ['thumb', 'index', 'middle', 'ring', 'pinky'];
  // Hand map
  var handTypes = ['left', 'right'];

  // Count each cycle in leap controller loop, useful for detecting or delaying
  // changes in pointer events
  var _cycleCounter = 0;
  var _scene = _engine.getScene();
  // Initialize leap controller
  var _controller = new Leap.Controller();
  // Pointers which we will track in the scene (representing fingertips)
  var _pointers = {
    // leftThumb: { color: '#ff0000', idx: 0, object: null, hand: 'left' },
    // leftIndex: { color: '#00ff00', idx: 1, object: null, hand: 'left' },
    // leftMiddle: { color: '#00ff00', idx: 2, object: null, hand: 'left' },
    // rightThumb: { color: '#ff0000', idx: 0, object: null, hand: 'right' },
    // rightIndex: { color: '#00ff00', idx: 1, object: null, hand: 'right' }
  };
  // Events that we will track and trigger callbacks for if they are registered
  var _events = {
    sign: {
      // Event for pinching thumb and index fingers
      leftPincer: {
        registers: function registers() {
          var thumb = _pointers.leftThumb.object;
          var index = _pointers.leftIndex.object;

          return pincerBetween(thumb, index);
        }
      },
      rightPincer: {
        registers: function registers() {
          var thumb = _pointers.rightThumb.object;
          var index = _pointers.rightIndex.object;

          return pincerBetween(thumb, index);
        }
      }
    },
    collision: {
      toCheck: [],
      registers: function registers() {}
    }
  };

  // Initialize this controller
  function init() {
    // Check if we are in vr mode, and set the HMD tracking optimization for leap
    _engine.VRDevicePresent(function (VRPresent) {
      var camera = _engine.getCamera();

      initPointers();
      _controller.setOptimizeHMD(VRPresent);

      // controller.use('transform', {
      //   // effectiveParent: camera,
      //   // quaternion: camera.quaternion,
      //   // position: new THREE.Vector3(0,0,-200)
      // })
      _controller.loop({ hand: alignPointers }).use('handEntry').on('handFound', registerHand).on('handLost', removeFingerPointers);
    });
  }

  function initPointers() {
    handTypes.forEach(function (handType) {
      fingerNameMap.forEach(function (fingerName, fingerIdx) {
        _pointers[[handType, capitalizeFirst(fingerName)].join('')] = {
          color: fingerIdx ? '#00ff00' : '#ff0000',
          idx: fingerIdx,
          object: null,
          hand: handType
        };
      });
    });
  }

  function registerHand(hand) {
    _.each(_pointers, function (pointer, pointerName) {
      if (pointerMapsToHand(pointer, hand)) {
        if (!pointer.object) addFingerPointer(pointer);
      }
    });
  }

  // Check if this is the correct hand
  function pointerMapsToHand(pointer, hand) {
    return hand && hand.fingers && hand.type === pointer.hand && hand.fingers[pointer.idx];
  }

  function pincerBetween(pointerOne, pointerTwo) {
    return pointerOne && pointerTwo ? distanceBetween(pointerOne, pointerTwo) < tipVicinity : false;
  }

  function alignPointers(hand) {
    _cycleCounter++;
    _.each(_pointers, function (pointer, pointerName) {
      if (pointerMapsToHand(pointer, hand)) {
        positionPointerToFinger(pointer, hand.fingers[pointer.idx]);
      }
    });
    checkPointerEvents();
  }

  function checkPointerEvents() {
    checkSignEvents();
    checkCollisionEvents();
  }

  function checkSignEvents() {
    var nowInt = Date.now();

    if (_events.collision.toCheck.lenght) _.each(_events.sign, function (event, name) {
      if ((!event.lastRegistered || nowInt - event.lastRegistered > eventDelay) && event.registers()) {
        console.log('registered | event name:', name);
        event.lastRegistered = Date.now();
        $('body').trigger('leapEvent', [{ name: name, event: event }]);
      }
    });
  }

  function checkCollisionEvents() {
    var nowInt = Date.now();
  }

  function addFingerPointer(pointer) {
    pointer.object = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.002, 0.002), new THREE.MeshBasicMaterial({ color: pointer.color }));
    _scene.add(pointer.object);
  }

  function positionPointerToFinger(pointer, finger) {
    pointer.object.position.copy(new THREE.Vector3().fromArray(finger.tipPosition).divideScalar(scaleFactor));

    pointer.object.position.y -= 0.4;
    pointer.object.position.z -= 0.4;
  }

  function removeFingerPointers(removedHand) {
    console.log('!hand removed');
    _.each(_pointers, function (pointer, pointerName) {
      if (pointer.object && removedHand.type === pointer.hand) {
        _scene.remove(pointer.object);
        pointer.object = null;
      }
    });
  }

  function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  return {
    controller: _controller,
    events: _events,
    init: init
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

  var leap = null;

  function init() {
    view = View(this);
    events = Events();
    director = Director(this);
    leap = LeapController(this);

    leap.init();
    director.init(scene);
    events.init();

    return this;
  }

  function getLeap() {
    return leap;
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

  function VRDevicePresent(done) {
    navigator.getVRDevices().then(function (devices) {
      return done(devices.length > 0);
    });
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
    VRDevicePresent: VRDevicePresent,
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
