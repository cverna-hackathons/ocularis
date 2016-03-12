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
  let rot = object.rotation;

  object.rotation.set(
    rot.x + rotationVec.x, rot.y + rotationVec.y, rot.z + rotationVec.z
  );
}

let _animations = {};

function Animate(object) {
  let finalCallback = null;
  let interimCallback = null;
  let transforms    = [];
  let id            = (
    Date.now() + '-' + object.id
  );

  console.log('init anim');

  let context = {
    id,
    start: (options) => {
      console.log('starting anim');
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
      delete _animations[id];
      if (typeof finalCallback === 'function') return finalCallback();
    },
    then: (fn) => {
      if (typeof fn === 'function') finalCallback = fn;
    }
  };

  return context;
}

function updateAnimations() {
  for (var id in _animations) {
    if (_animations.hasOwnProperty(id)) {
      let anim = _animations[id];
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
  frameLength = (frameLength || 60);

  // let initialPosition  = object.position.clone();
  let moveIncrementVec = deltaVec.divideScalar(frameLength);
  let framesLeft       = frameLength + 0;
  let animStarted      = false;
  
  return {
    id: parseInt(Math.random() * 10000).toString(),
    object: object,
    started: animStarted,
    next: () => {
      framesLeft--;
      if (framesLeft > 0) {
        animStarted = true;
        transformFn(object, deltaVec);
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
  let _scene, _camera, _arrow, _raycaster, _events, _settings;
  // Create a shared object to assign instance in view
  let _inView = {};

  let _animations = {};

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
    // Check the instance in view and is not already activated
    // If there is one, check it's view frame distance to camera  
    if (_inView.instance && !_inView.instance._activated) {
      activateComponent();
    }
    else if (_inView.instance && _inView.instance._activated) {
      deactivateComponent(_inView.instance);
    }
    else console.log('No component in view.');
  }

  /**
   * Align component to a fitting plane visible from camera, move and rotate
   * @return {void}
   */
  function activateComponent() {
    let component = _inView.instance.component;
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

    component.updateMatrixWorld();
    // Get the distance and rotation relations between fitting plane and frame
    let transformRelation = 
      getTransformRelation(_inView.instance.frame, fittingPlane, 1);

    // Negate on the z axis, since we are coming closer to camera
    transformRelation.distanceVec.z *= -1;

    Animate(component)
      .start({
        deltaVec: transformRelation.distanceVec, transformFn: moveBy
      })
      .start({
        deltaVec: transformRelation.rotationVec, transformFn: rotateBy 
      })
    .then(() => {
      console.log('animation move ended.');
    });

    _inView.instance._activated = true;
    console.log('transformRelation:', transformRelation);

    renderActivationData();
    setTimeout(() => _scene.remove(fittingPlane), 3000);
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
  function arrangeComponent(instance, animated) {
    let idx         = instance.idx;
    let arrangement = componentArrangementMap[idx];
    
    console.log('idx, arrangement:', idx, arrangement, window.ocularisComponents);
    if (arrangement) {
      let pos = arrangement.position.clone();
      let rot = arrangement.rotation.clone();
      
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

function Scene() {
  return new THREE.Scene();
}

// Render component preview
function Preview(options) {
  let self = { update: true };
  let scene = Scene();
  let director = Director();
  let renderer = new THREE.WebGLRenderer();
  let $container = options.$container;
  let width = $container.width();
  let height = $container.height();
  let camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
  
  director.initPreview(scene, camera);
  options.component.preview = true;
  scene.add(Light());
  director.addComponent(options.component, () => self.update = true);
  renderer.setSize(width, height);
  $container.html(renderer.domElement);

  // Draw component preview
  let draw = function() {
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
  $('.component-preview').each((elemIndex, previewElement) => {
    Preview(inferOptionsFrom(previewElement));
  });

  function inferOptionsFrom(previewElement) {
    var $elem   = $(previewElement);
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