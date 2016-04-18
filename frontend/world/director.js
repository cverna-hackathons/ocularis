import Light from './light';
import Background from './background';
import Arrow from '../dummies/arrow';
import { Plane } from '../dummies/fitting';
import { 
  componentArrangementMap,
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
  let _inView             = {};
  let _engine             = engine;
  let _previewMode        = false;
  let _VRDevicesPresent   = false;

  const activationID      = 'componentActivation';

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
    window.ocularisComponents.forEach(instance => {
      if (typeof(instance.update) === 'function') instance.update();
    });
  }

  /**
   * Will bind key down on spacebar to activating the component in view
   * @return {void}
   */
  function initEvents() {
    _debug  = _settings.debug;
    _events = _engine.getEvents();
    _events.addEventListeners(
      ((_settings && _settings.events && _settings.events.activationKeys) ? 
        _settings.events.activationKeys : 'spacebar'
      ) , toggleComponentActivation, activationID
    );
    _engine.VRDevicePresent((present) => { 
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
      _camera.rotation.z += ((Math.PI / 180) * 2);
      _camera.rotation.y += ((Math.PI / 180) * 2);
      _camera.position.x -= .1;
    }

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

    setTimeout(() => _scene.remove(fittingPlane), 10);
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
    instance.draw([
      {
        drawableId: 'leftSide',
        content: 'images/sample_image_for_leftside.jpg',
        type: 'image'
      },
      {
        drawableId: 'main',
        content: 'text',
        type: 'text'
      },
      {
        drawableId: 'rightSide',
        content: 'Webcam video for webcam is loaded to the left.',
        type: 'text'
      }
    ]);
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
    window.ocularisComponents.forEach((instance, instanceIdx) => {
      let intersections = _raycaster.intersectObject(instance.frame);
      // Get the closest component in intersection
      if (intersections.length && intersections[0].distance < _inView.distance) {
        _inView.distance  = intersections[0].distance;
        _inView.instance  = instance;
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
    window.ocularisComponents.forEach((instance) => {
      if (typeof(_inView.instance.highlight) === 'function') {
        let isInView = (instance.id === _inView.instance.id);
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
    loadSettings((errs, settings) => {
      if (!errs) {
        _settings = settings;
        settings.components.forEach((component, componentIdx) => {
          component.idx = componentIdx;
          addComponent(component);
        });
        Background(settings.background, _engine, (bg) => {
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
   * @param  {String} name - Component name 
   * @return {Function} Component constructor function
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
