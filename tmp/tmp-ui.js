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

/**
 * Return proportional properties
 * @param  {Object THREE.Plane} Frame that bounds the object viewable area
 * @param  {Object THREE.Camera} Scene camera object
 * @return {Float} Distance from camera, to fit the frame in view
 * 
 */
function distanceToCameraFit(frame, camera) {

  let cameraAspect = camera.aspect;
  let frameParams = frame.geometry.parameters;
  let frameAspect = (frameParams.width / frameParams.height);
  let fovRad = ((Math.PI / 180) * camera.fov);
  let hFovRad = fovRad * cameraAspect;
  let cameraWider = (cameraAspect > frameAspect);
  let frameWidth = (
    cameraWider ? (frameParams.height * cameraAspect) : frameParams.width
  );
  // let frameHeight = (
  //   cameraWider ? frameParams.height : (frameParams.width * cameraAspect)
  // );
  // let cameraFrame = new THREE.Mesh(
  //   new THREE.PlaneGeometry(frameWidth, frameHeight),
  //   new THREE.MeshBasicMaterial({ color: '#00ff00', wireframe: true })
  // );
  let zDistance = (frameWidth / (2 * Math.tan(hFovRad / 2)));

  return zDistance;

  
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
  let _scene, _camera, _arrow, _raycaster;

  // Create a shared object to assign instance in view
  let _inView = {};

  const initialDistance = 2.5;
  const angleShift      = (Math.PI / 180 * 36);
  const xShift          = (Math.sin(angleShift) * initialDistance);
  const zShift          = (Math.cos(angleShift) * -initialDistance);
  const selectedColor   = '#ff0000';
  const unselectedColor = '#eeeeee';

  // Serves to place and rotate the component instances into sectors
  // of ?semi-dodecahedron (6 max for now?), may want to generate this later
  const componentArrangementMap = [
    // Initial front facing position
    { position: [0,0,-initialDistance], rotation: [0,0,0] },
    // Front left
    { position: [xShift, 0, zShift], rotation: [0, -angleShift, 0] },
    // Front right
    { position: [-xShift, 0, zShift], rotation: [0, angleShift, 0] }    
  ];

  /**
   * Initialize the objects in scene
   * @param  {THREE.js scene} object
   * @return {void}
   */
  function init() {
    _raycaster = new THREE.Raycaster();
    _scene = engine.getScene();
    _scene.add(Light());
    // Add basic pivot object to the scene (red box)
    _scene.add(Pivot());
    addComponents();
  }

  function checkForUpdates() {
    selectComponentInView();
    return;
  }


  function findDisplayFrame(componentFrame) {
    _camera = _camera || engine.getCamera();
    let zDistance = distanceToCameraFit(componentFrame, _camera);

    console.log('findDisplayFrame | zDistance:', zDistance);
  }

  function selectComponentInView() {
    // Check which component am I looking at
    _inView.distance = 100; // Only capture objects that are no further than 100
    _inView.instance = null;
    
      // Cast a ray down the camera vector
    if (_arrow) _scene.remove (_arrow);
    _camera = engine.getCamera();
    _arrow = new THREE.ArrowHelper(
      _camera.getWorldDirection(), 
      _camera.getWorldPosition(), 1, 0x00ff00
    );
    _scene.add(_arrow);
    _raycaster.setFromCamera( {x: 0, y: 0}, _camera);
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
      }
      else {
        instance.frame.material.color.set(unselectedColor);
      }
    });
  }

  function addComponents() {
    initializeComponentContainers();
    console.log('loading addComponents');
    loadSettings((errs, settings) => {
      if (!errs) {
        settings.components.forEach((component, componentIdx) => {
          component.idx = componentIdx;
          addComponent(component);
        });
      }
    });
  }

  function initializeComponentContainers() {
    initComponents();
    initComponentConstructors();
  }

  function initComponents() {
    console.log('initComponents');
    window.ocularisComponents = new Array();
  }

  function initComponentConstructors() {
    window.ocularisComponentConstructors = new Array();
  }

  function addComponent(component) {
    console.log('addComponents | component:', component);
    if (component.publicPath) {
      $.getScript(component.publicPath, (data, textStatus, jqxhr) => {
        console.log('addComponents | textStatus, jqxhr:', textStatus, jqxhr);
        var componentConstructor = getComponentConstructor(component.name);

        if (typeof componentConstructor === 'function') {
          console.log('found constructor');
          var instance = componentConstructor(component.id || Date.now());

          // If component is in preview, do not add to global
          // in order to prevent displacement in preview
          if (!component.preview) {
            arrangeComponent(instance);
            findDisplayFrame(instance.frame);
            // instance.component.visible = false;
          }
          _scene.add(instance.component);
        }
        else console.warn(
          'Loaded object is not a constructor function!', componentConstructor
        );
      });
    }
  }

  function arrangeComponent(instance) {
    let idx = window.ocularisComponents.length;
    let arrangement = componentArrangementMap[idx];
    
    console.log('idx, arrangement:', idx, arrangement, window.ocularisComponents)
    if (arrangement) {
      let pos = arrangement.position;
      let rot = arrangement.rotation;
      
      instance.component.position.set(pos[0], pos[1], pos[2]);
      instance.component.rotation.set(rot[0], rot[1], rot[2]);
      window.ocularisComponents.push(instance);
    }
  }

  function getComponentConstructor(name) {
    var hit;
    var constructors = (window.ocularisComponentConstructors || []);

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
  let self = { update: true };
  let director = Director();
  let scene = Scene();
  let renderer = new THREE.WebGLRenderer();
  let $container = options.$container;
  let width = $container.width();
  let height = $container.height();
  let camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
  
  options.component.preview = true;
  scene.add(Light());
  director.addComponent(options.component, scene);
  renderer.setSize(width, height);
  $container.html(renderer.domElement);

  // Draw component preview
  let draw = function() {
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