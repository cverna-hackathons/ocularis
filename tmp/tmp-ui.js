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

  function initPreview(scene, camera) {
    _scene = scene;
    _camera = camera;
    _previewMode = true;
  }

  function checkForUpdates() {
    selectComponentInView();
  }

  // This will bind key down on spacebar to activating the component in view
  function initializeActivationEvent() {
    _events = _engine.getEvents();
    _events.addEventListener(
      ((_settings && _settings.general && _settings.general.activationKey) ? 
        _settings.general.activationKey : 'spacebar'
      ) , activateComponentInView, activationID
    );
  }

  
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

  function findDisplayFrame(componentFrame) {
    _camera = _camera || engine.getCamera();
    let zDistance = distanceToCameraFit(componentFrame, _camera);

    console.log('findDisplayFrame | zDistance:', zDistance);
  }

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

  function highlightSelection() {
    window.ocularisComponents.forEach((instance) => {
      if (_inView.instance && instance.id === _inView.instance.id) {
        _inView.instance.frame.material.color.set(selectedColor);
      } else instance.frame.material.color.set(unselectedColor);
    });
  }

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

  function initializeComponentContainers() {
    initComponents();
    initComponentConstructors();
  }

  function initComponents() {
    window.ocularisComponents = new Array();
  }

  function initComponentConstructors() {
    window.ocularisComponentConstructors = new Array();
  }

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
    }
  }

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