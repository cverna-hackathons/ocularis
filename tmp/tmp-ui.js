function Light() {
  return new THREE.AmbientLight(0xeeeeee);
}

function Background (options, done) {

  options = options || { 
    bgPath: 'images/backdrop_desert.jpg',
    radius: 50,
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
 * @param  {Object THREE.Mesh} Frame that bounds the object viewable area
 * @param  {Object THREE.Camera} Scene camera object
 * @return {Object object: THREE.Plane, zDistance: Float} Plane that is scaled 
 *         to our component frame and zDistance that gives us distance from camera
 *         in which we can see the component fit into view
 * 
 */
function Plane(frame, camera) {

  frame.updateMatrixWorld();

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
  
  fittingPlane.name = 'fittingPlane';

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
function getTransformRelation(objectOne, objectTwo) {

  objectOne.updateMatrixWorld();
  objectTwo.updateMatrixWorld();

  let relation       = {};
  
  let objectOnePos   = objectOne.position.clone();
  let objectTwoPos   = objectTwo.position.clone();

  let objectOneRot   = new THREE.Euler();
  let objectTwoRot   = new THREE.Euler();

  let oneQuaternion = new THREE.Quaternion();
  let twoQuaternion = new THREE.Quaternion();

  oneQuaternion.setFromRotationMatrix(objectOne.matrixWorld);
  twoQuaternion.setFromRotationMatrix(objectTwo.matrixWorld);

  objectOnePos.setFromMatrixPosition(objectOne.matrixWorld);
  objectTwoPos.setFromMatrixPosition(objectTwo.matrixWorld);

  objectOneRot.setFromQuaternion(oneQuaternion);
  objectTwoRot.setFromQuaternion(twoQuaternion);

  let distanceVec = objectOnePos.sub(objectTwoPos);
  let rotationVec = objectOneRot.toVector3().sub(objectTwoRot.toVector3());

  relation.distanceVec = distanceVec;
  relation.rotationVec = rotationVec;
  relation.distance    = objectOnePos.distanceTo(objectTwoPos);

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
  let rot = object.rotation.toVector3();
  rot.addVectors(rot, rotationVec);
  object.rotation.setFromVector3(rot);
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

  object.updateMatrixWorld();

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
  frameLength = (frameLength || 20);

  // let initialPosition  = object.position.clone();
  let increment = deltaVec.divideScalar(frameLength);
  let framesLeft       = frameLength + 0;
  
  return {
    id: parseInt(Math.random() * 10000).toString(),
    object: object,
    next: () => {
      if (framesLeft > 0 && deltaVec.length() !== 0) {
        transformFn(object, increment);
        framesLeft--;
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
    _camera.position.x -= .1;

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
    // if (_fitting) {
    //   _scene.remove(_fitting.object);
    // }

    _camera.updateMatrixWorld();
    _fitting = Plane(instance.frame, _camera);
    // Update transform matrix according to world, 
    // so we get the correct transform relation
    
    let fittingPlane = _fitting.object;    
    let _cameraLookAt= _camera.getWorldDirection();
    let cameraPos    = _camera.position.clone();
    let shiftVector  = 
      _cameraLookAt.multiplyScalar(_fitting.zDistance);
    
    // Add the dummy fitting plane to scene
    _scene.add(fittingPlane);
    // Move and rotate the fitting plane
    fittingPlane.position.copy(cameraPos.add(shiftVector));
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

    // component.updateMatrixWorld();
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
    instance.draw([
      {
        drawableId: 'main',
        content: 'Go is a fascinating strategy board game that\'s been popular for at least 2,500 years, and probably more. Its simple rules and deep strategies have intrigued everyone from emperors to peasants for hundreds of generations. And they still do today. The game Go has fascinated people for thousands of years.',
        type: 'text',
        bgColor: 'rgba(0, 0, 0, 0.3)',
        textColor: 'rgba(255, 255, 255, 0.7)'
      },
      {
        drawableId: 'leftSide',
        content: 'images/sample_image_for_leftside.jpg',
        type: 'image'
      },
    ]);
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
      if (typeof(_inView.instance.highlight) === 'function') {
        let isInView = (instance.id === _inView.instance.id);
        _inView.instance.highlight(isInView);
      }
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
    let component   = instance.component;
    let arrangement = componentArrangementMap[idx];

    if (arrangement) {
      let pos = arrangement.position.clone();
      let rot = arrangement.rotation.clone();
      
      console.log('arrangeComponent, arrangement:', arrangement)
      if (animated) {
        let deltaPos = pos.sub(component.position);
        let deltaRot = rot.sub(component.rotation);

        Animate(component)
          .start({ transformFn: moveBy, deltaVec: deltaPos })
          .start({ transformFn: rotateBy, deltaVec: deltaRot })
        .then(finalize);
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