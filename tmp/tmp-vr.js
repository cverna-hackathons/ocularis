function moveTo(object, distanceVec) {
  object.position.add(distanceVec);
}

function rotateTo(object, rotationVec) {
  object.rotation.copy(rotationVec);
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
    material: new THREE.MeshBasicMaterial({color: 'red'})
  });

  var geometry = new THREE.CubeGeometry(opt.size.width, opt.size.height, opt.size.depth);
  var box = new THREE.Mesh(geometry, opt.material);

  box.position.x = opt.position.x;
  box.position.y = opt.position.y;
  box.position.z = opt.position.z;

  return box;
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
  
  let relation       = {};
  
  let objectOnePos   = objectOne.position;
  let objectTwoPos   = objectTwo.position;

  let objectOneRot   = objectOne.rotation;
  let objectTwoRot   = objectTwo.rotation;

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

function Director(engine) {
  // Track the camera and scene objects
  // Also add a helper arrow to see what objects camera is directly looking at
  // Add raycaster object to find intersects for the above
  let _scene, _camera, _arrow, _raycaster, _events, _settings;
  // Create a shared object to assign instance in view
  let _inView = {};

  let _engine = engine;

  let _previewMode = false;

  const initialDistance = 2.5;
  const angleShift      = (Math.PI / 180 * 36);
  const xShift          = (Math.sin(angleShift) * initialDistance);
  const zShift          = (Math.cos(angleShift) * -initialDistance);
  const selectedColor   = '#ff0000';
  const unselectedColor = '#eeeeee';
  const activationID    = 'componentActivation';

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
    _events.addEventListener(
      ((_settings && _settings.general && _settings.general.activationKey) ? 
        _settings.general.activationKey : 'spacebar'
      ) , activateComponentInView, activationID
    );
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
      let fitting = Plane(_inView.instance.frame, _camera);
      let fittingPlane = fitting.object;
      let _cameraLookAt = cameraLookAt();
      let cameraPos    = _camera.position;
      let shiftVector  = _cameraLookAt
          .applyQuaternion(_camera.quaternion)
          .multiplyScalar(fitting.zDistance);
      
      // Add the dummy fitting plane to scene
      _scene.add(fittingPlane);
      // Move and rotate the fitting plane
      fittingPlane.position.addVectors(cameraPos, shiftVector);
      fittingPlane.rotation.copy(_camera.rotation);

      console.log('shiftVector:', shiftVector);
      console.log('fitting:', fitting);
      console.log('_inView', _inView);

      // Get the distance and rotation relations between fitting plane and frame
      let transformRelation = 
        getTransformRelation(_inView.instance.frame, fittingPlane, 1);

      moveTo(_inView.instance.component, transformRelation.distanceVec);
      rotateTo(_inView.instance.component, transformRelation.rotationVec);
      _inView.instance.activated = true;
      console.log('transformRelation:', transformRelation);

      setTimeout(() => _scene.remove(fittingPlane), 3000);
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
    if (_arrow) _scene.remove (_arrow);
    _scene.add(Arrow(_camera));
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
    console.log('addComponent, _previewMode:', _previewMode)
    if (component.publicPath) {
      $.getScript(component.publicPath, (data, textStatus, jqxhr) => {
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
   * @param  {instance: Object} Component instance
   * @return {void}
   */
  function arrangeComponent(instance) {
    let idx         = window.ocularisComponents.length;
    let arrangement = componentArrangementMap[idx];
    
    console.log('idx, arrangement:', idx, arrangement, window.ocularisComponents);
    if (arrangement) {
      let pos = arrangement.position;
      let rot = arrangement.rotation;
      
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
  let renderer = new THREE.WebGLRenderer({

  });
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
    $("body").on("keydown", trackKeys);
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