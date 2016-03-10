import Light from './light';
import Pivot from '../dummies/pivot';
import Arrow from '../dummies/arrow';
import { Plane } from '../dummies/fitting';
import { 
  planeToCameraRotation,
  cameraLookAt,
  getTransformRelation
} from '../helpers/measures';
import { loadSettings } from '../helpers/routes';
import { moveTo, rotateTo } from '../helpers/transforms';

export default function(engine) {
  
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
