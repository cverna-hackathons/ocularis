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
  let rot = object.rotation.toVector3();
  rot.addVectors(rot, rotationVec);
  object.rotation.setFromVector3(rot);
}

function Scene() {
  return new THREE.Scene();
}

function Light() {
  return new THREE.AmbientLight(0xeeeeee);
}

function Background (options, done) {

  options = options || { 
    bgPath: 'images/backdrop_desert.jpg',
    radius: 20,
    hCutOff: 0,
    vCutOff: 1,
    resolution: 20 
  };

  let texLoader   = new THREE.TextureLoader();
  let sphere      = new THREE.SphereGeometry(
    options.radius, options.resolution, options.resolution
    // , (Math.PI + options.hCutOff), (Math.PI - (2 * options.hCutOff)), options.vCutOff,
    //   (Math.PI - (2 * options.vCutOff))
  );
  let material    = new THREE.MeshBasicMaterial({
    side: THREE.BackSide
  });
  let backdrop    = new THREE.Mesh(sphere, material);  

  texLoader.load(options.bgPath, onTextureLoaded);

  function onTextureLoaded(texture) {
    console.log('onTextureLoaded | texture:', texture);
    material.map = texture;
    texture.needsUpdate = true;

    return done(backdrop);
  }

  
}

function Arrow(camera) {
  return new THREE.ArrowHelper(
    camera.getWorldDirection(), 
    camera.getWorldPosition(), 1, 0x00ff00
  );
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
  let cameraAspect  = camera.aspect;
  let frameParams   = frame.geometry.parameters;
  let cameraLookAt  = new THREE.Vector3(0, 0, -1);
  let frameAspect   = (frameParams.width / frameParams.height);
  let fovRad        = ((Math.PI / 180) * camera.fov);
  let hFovRad       = fovRad * cameraAspect;
  let cameraWider   = (cameraAspect > frameAspect);
  let frameWidth    = (
    cameraWider ? (frameParams.height * cameraAspect) : frameParams.width
  );
  let frameHeight = (
    cameraWider ? frameParams.height : (frameParams.width * cameraAspect)
  );
  let fittingPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(frameWidth, frameHeight),
    new THREE.MeshBasicMaterial({ color: '#00ff00', wireframe: true })
  );

  return {
    object: fittingPlane,
    zDistance: (frameWidth / (2 * Math.tan(hFovRad / 2)))
  };
}

const initialDistance = 5;
const angleShift      = (Math.PI / 180 * 36);
const xShift          = (Math.sin(angleShift) * initialDistance);
const zShift          = (Math.cos(angleShift) * -initialDistance);
// Serves to place and rotate the component instances into sectors
// of ?semi-dodecahedron (6 max for now?), may want to generate this later
const componentArrangementMap = [
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
  }
];


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
  
  let relation       = {};
  
  let objectOnePos   = new THREE.Vector3();
  let objectTwoPos   = new THREE.Vector3();

  let objectOneRot   = objectOne.rotation;
  let objectTwoRot   = objectTwo.rotation;

  objectOnePos.setFromMatrixPosition(objectOne.matrixWorld);
  objectTwoPos.setFromMatrixPosition(objectTwo.matrixWorld);

  let distanceVec = new THREE.Vector3(
    (objectOnePos.x - objectTwoPos.x),
    (objectOnePos.y - objectTwoPos.y),
    (objectOnePos.z - objectTwoPos.z)
  );
  let rotationVec = new THREE.Vector3(
    (objectOneRot.x - objectTwoRot.x),
    (objectOneRot.y - objectTwoRot.y),
    (objectOneRot.z - objectTwoRot.z)
  );

  relation.distanceVec = distanceVec;
  relation.rotationVec = rotationVec;
  relation.distance    = objectOnePos.distanceTo(objectTwoPos);
  relation.isClose     = (relation.distance < vicinity);

  return relation;
}

function loadSettings(done) {
  $.get('/load_settings', response => {
    if (response && response.settings) {
      return done(null, response.settings);
    }
    else return done('Unable to load user configuration.');
  });
}

let _animations = {};

/**
 * Object animation setup function 
 * @param  {THREE.Object} object that is to be animated
 * @return {Object} Returns iterable object 
 *                  that is used for animation stepping or cancellation 
 */
function Animate(object) {
  
  let finalCallback = null;
  let interimCallback = null;
  let transforms    = [];
  let id            = (
    Date.now() + '-' + object.id
  );

  let context = {
    object,
    id,
    start: (options) => {
      transforms.push(animatedTransform(
        object, options.transformFn, options.deltaVec, options.frameLength
      ));
      _animations[id] = context;
      return context;
    },
    next: () => {
      let formerLen = transforms.length;

      transforms = transforms.filter((transform) => transform.next());
      if (formerLen > transforms.length && typeof interimCallback === 'function') {
        interimCallback(transforms.length);
      }
      return (transforms.length > 0);
    },
    interim: (fn) => {
      if (typeof fn === 'function') interimCallback = fn;
    },
    complete: () => {
      if (typeof finalCallback === 'function') return finalCallback();
    },
    then: (fn) => {
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
      let anim = _animations[id];
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
  frameLength = (frameLength || 30);

  // let initialPosition  = object.position.clone();
  let increment = deltaVec.divideScalar(frameLength);
  let framesLeft       = frameLength + 0;
  
  return {
    id: parseInt(Math.random() * 10000).toString(),
    object: object,
    next: () => {
      framesLeft--;
      if (framesLeft > 0 && deltaVec.length() !== 0) {
        transformFn(object, increment);
        return true;
      }
      else return false;
    }
    // , cancel: () => object.position.copy(initialPosition)
  };  
}

function Director(engine) {
  // Track the camera and scene objects
  // Also add a helper arrow to see what objects camera is directly looking at
  // Add raycaster object to find intersects for the above
  let _scene, _camera, _arrow, _raycaster, _events, _settings, _fitting, _debug;
  // Create a shared object to assign instance in view
  let _inView = {};

  let _engine = engine;

  let _previewMode = false;

  const selectedColor   = '#ff0000';
  const unselectedColor = '#eeeeee';
  const activationID    = 'componentActivation';

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
    _debug  = _settings.debug;
    _events = _engine.getEvents();
    _events.addEventListener(
      ((_settings && _settings.general && _settings.general.activationKey) ? 
        _settings.general.activationKey : 'spacebar'
      ) , toggleComponentActivation, activationID
    );
  }

  /**
   * Will check the component in view,
   * and align it to a fitting plane visible from camera
   * @return {void}
   */
  function toggleComponentActivation() {
    // XXX: just changing rotation for testing
    _camera.rotation.z += ((Math.PI / 180) * 2);
    _camera.rotation.y += ((Math.PI / 180) * 2);

    let instanceInView = _inView.instance;

    if (_inView.instance && !_inView.instance._noEvents) {
      // Check the instance in view and is not already activated
      // If there is one, check it's view frame distance to camera
      if (!instanceInView._activated) {
        window.ocularisComponents.forEach(instance => {
          if (instanceInView.id === instance.id) {
            instance._noEvents = true;
            activateComponent(instance, () => {
              instance._noEvents = false;
            });
          } else if (instance._activated) {
            instance._noEvents = true;
            deactivateComponent(instance, () => {
              instance._noEvents = false;
            });
          }
        });
      }
      else if (instanceInView._activated) {

        instanceInView._noEvents = true;
        deactivateComponent(instanceInView, () => {
          instanceInView._noEvents = false;
        });
      }
    }      
    else console.log('No component in view or no events allowed.');
  }

  function setFitting(instance) {
    _fitting = Plane(instance.frame, _camera);
    // Update transform matrix according to world, 
    // so we get the correct transform relation
    
    let fittingPlane = _fitting.object;    
    let _cameraLookAt = _camera.getWorldDirection();
    let cameraPos    = _camera.position;
    let shiftVector  = _cameraLookAt
        .applyQuaternion(_camera.quaternion)
        .multiplyScalar(_fitting.zDistance);
    
    // Add the dummy fitting plane to scene
    _scene.add(fittingPlane);
    // Move and rotate the fitting plane
    fittingPlane.position.addVectors(_cameraLookAt, shiftVector);
    fittingPlane.rotation.copy(_camera.rotation);
    console.log('shiftVector, _camera.rotation, _cameraLookAt:', shiftVector, _camera.rotation, _cameraLookAt);
    console.log('_fitting:', _fitting);

    setTimeout(() => _scene.remove(fittingPlane), 3000);
  }

  /**
   * Align component to a fitting plane visible from camera, move and rotate
   * @return {void}
   */
  function activateComponent(instance, done) {
    let component = instance.component;

    console.log('_inView', _inView);

    component.updateMatrixWorld();
    // Set up fitting for animation 
    setFitting(instance);
    // Get the distance and rotation relations between fitting plane and frame
    let transformRelation = 
      getTransformRelation(instance.frame, _fitting.object, 1);
    // Negate on the z axis, since we are coming closer to camera
    transformRelation.distanceVec.negate();
    transformRelation.rotationVec.negate();

    Animate(component)
      .start({ deltaVec: transformRelation.distanceVec, transformFn: moveBy })
      .start({ deltaVec: transformRelation.rotationVec, transformFn: rotateBy })
    .then(() => {
      renderActivationData(instance);
      
      instance._activated = true;
      if (done) return done();
    });
    
    console.log('transformRelation:', transformRelation);
  }

  function renderActivationData(instance) {
    // Get initial data from provider
    // Render it to drawables
    instance.draw([{
      drawableId: 'main',
      content: 'Go is a fascinating strategy board game that\'s been popular for at least 2,500 years, and probably more. Its simple rules and deep strategies have intrigued everyone from emperors to peasants for hundreds of generations. And they still do today. The game Go has fascinated people for thousands of years.',
      type: 'text',
      bgColor: 'rgba(0, 0, 0, 0.3)',
      textColor: 'rgba(255, 255, 255, 0.7)'
    }]);
  }

  /**
   * Reset component arrangement to initial position
   * @param  {Object} Component instance to rearrange
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
    window.ocularisComponents.forEach((instance, instanceIdx) => {
      let intersections = _raycaster.intersectObject(instance.frame);
      // Get the closest component in intersection
      if (intersections.length && intersections[0].distance < _inView.distance) {
        _inView.distance  = intersections[0].distance;
        _inView.instance  = instance;
      }
    });
    highlightSelection();
  }

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
    window.ocularisComponents.forEach((instance) => {
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
    loadSettings((errs, settings) => {
      if (!errs) {
        _settings = settings;
        settings.components.forEach((component, componentIdx) => {
          component.idx = componentIdx;
          addComponent(component);
        });
        Background(null, (bg) => _scene.add(bg));
        // _scene.fog = new THREE.FogExp2(0xeeeeee, 0.05);
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
      $.getScript(component.publicPath, (data, textStatus, jqxhr) => {
        var componentConstructor = getComponentConstructor(component.name);

        if (typeof componentConstructor === 'function') {
          var instance = componentConstructor(component.id || Date.now());
          // Assign order index, will be reused by arrangement
          instance.idx = component.idx;
          // If component is in preview, do not add to global
          // in order to prevent displacement in preview
          _scene.add(instance.component);
          // instance.frame.visible = (_debug === true);
          if (!_previewMode) {
            arrangeComponent(instance);
            window.ocularisComponents.push(instance);
          } else {
            _inView.instance = instance;
            activateComponentInView();
          }
        }
        else console.warn(
          'Loaded object is not a constructor function!', componentConstructor
        );
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
    let idx         = instance.idx;
    let arrangement = componentArrangementMap[idx];

    if (arrangement) {
      let pos = arrangement.position.clone();
      let rot = arrangement.rotation.clone();
      
      console.log('arrangeComponent, arrangement:', arrangement)
      if (animated) {
        let deltaPos = pos.sub(instance.component.position);
        let deltaRot = rot.sub(instance.component.rotation);

        Animate(instance.component)
          .start({ transformFn: moveBy, deltaVec: deltaPos })
          .start({ transformFn: rotateBy, deltaVec: deltaRot })
        .then(done);
      } else {
        instance.component.rotation.setFromVector3(rot);
        instance.component.position.copy(pos);
        if (done) return done();
      }
    }
  }

  /**
   * Retrieves the component constructor from global array
   * @param  {name: String} 
   * @return {function} Component constructor function
   */
  function getComponentConstructor(name) {
    var _constructor;
    var constructors = (window.ocularisComponentConstructors || []);

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
    init,
    initPreview,
    addComponents,
    addComponent,
    initComponents,
    checkForUpdates
  };
}

function Renderer() {
  let renderer = new THREE.WebGLRenderer();
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

  }

}

function Camera() {

  var config = {
    FOV: 75,
    CUTOFF: 0.1,
    ASPECT_RATIO: window.innerWidth / window.innerHeight,
    TARGET_DISTANCE: 10000
  };

  return new THREE.PerspectiveCamera(
    config.FOV, config.ASPECT_RATIO, config.CUTOFF, config.TARGET_DISTANCE
  );
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

  function getEventKeyDirection (event, trigger) {
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

  function trackKeys (event) {
    triggerKeyEvent(getEventKeyDirection(event, 'keydown'));
  }

  function setTriggers () {
    $('body').on('keydown', trackKeys);
  }

  function triggerKeyEvent(key) {
    if (listeners[key]) listeners[key].forEach(obj => {
      return obj.callback()
    });
  }

  function addEventListener(key, done, id) {
    if (!listeners[key]) listeners[key] = [];
    id = (id || Date.now());
    listeners[key].push({ callback: done, id: id });
    return id;
  }

  function removeEventListener(id) {
    for(var key in listeners) {
      for (var i=0, len=listeners[key].length; i<len; i++) {
        if (listeners[key][i].id === id) {
          listeners[key].splice(i, 1);
        }
      }
    }
  }

  setTriggers();

  return {
    getListeners: () => listeners,
    addEventListener,
    removeEventListener
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
    VRControls,
    VREffect,
    VRManager,
    disable: function() {
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
    init,
    draw,
    switchVR,
    enableVR,
    disableVR,
    update,
    getVREnabled,
    getFrameUpdate,
    setFrameUpdate,
    setCamera,
    getRenderer,
    getView,
    getCamera,
    getScene,
    getEvents,
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