import Light from './light';
import Background from './background';
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
import { rotateBy, moveBy } from '../helpers/transforms';
import { Animate, updateAnimations } from './animation';


export default function(engine) {
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

  function setFitting() {
    _fitting = Plane(_inView.instance.frame, _camera);
    
    let fittingPlane = _fitting.object;    
    let _cameraLookAt = cameraLookAt();
    let cameraPos    = _camera.position;
    let shiftVector  = _cameraLookAt
        .applyQuaternion(_camera.quaternion)
        .multiplyScalar(_fitting.zDistance);
    
    // Add the dummy fitting plane to scene
    _scene.add(fittingPlane);
    // Move and rotate the fitting plane
    fittingPlane.position.addVectors(cameraPos, shiftVector);
    fittingPlane.rotation.copy(_camera.rotation);
    console.log('shiftVector:', shiftVector);
    console.log('_fitting:', _fitting);

    setTimeout(() => _scene.remove(fittingPlane), 3000);
  }

  /**
   * Align component to a fitting plane visible from camera, move and rotate
   * @return {void}
   */
  function activateComponent() {
    let component = _inView.instance.component;

    console.log('_inView', _inView);
    // Set up fitting for animation 
    setFitting();

    // Update transform matrix according to world, 
    // so we get the correct transform relation
    component.updateMatrixWorld();
    
    // Get the distance and rotation relations between fitting plane and frame
    let transformRelation = 
      getTransformRelation(_inView.instance.frame, _fitting.object, 1);

    // Negate on the z axis, since we are coming closer to camera
    transformRelation.distanceVec.z *= -1;

    Animate(component)
      .start({
        deltaVec: transformRelation.distanceVec, transformFn: moveBy
      })
      .start({
        deltaVec: transformRelation.rotationVec, transformFn: rotateBy 
      })
    .then(renderActivationData);

    _inView.instance._activated = true;
    console.log('transformRelation:', transformRelation);

  }

  function renderActivationData() {
    // Get initial data from provider
    // Render it to drawables
    _inView.instance.draw([{
      drawableId: 'main',
      content: 'Initial main text for instance of ' + _inView.instance.id + '.',
      type: 'text',
      bgColor: 'rgba(100, 100, 100, 0.3)',
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
        Animate(instance.component)
          .start({
            transformFn: moveBy,
            deltaVec: pos
          })
          .start({
            transformFn: rotateBy,
            deltaVec: rot
          })
      } else {
        instance.component.rotation.set(rot.x, rot.y, rot.z);
        instance.component.position.copy(pos);
      }
      
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
