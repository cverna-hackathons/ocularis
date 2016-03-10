import Light from './light';
import Pivot from '../dummies/pivot';
import Arrow from '../dummies/arrow';
import { Plane } from '../dummies/fitting';
import { 
  componentArrangementMap,
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
