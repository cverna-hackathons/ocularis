import Light from './light';
import Pivot from '../dummies/pivot';
import { distanceToCameraFit } from '../helpers/measures';
import { loadSettings } from '../helpers/routes';


export default function(engine) {
  
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
    window.ocularisComponents = new Array();
  }

  function initComponentConstructors() {
    window.ocularisComponentConstructors = new Array();
  }

  function addComponent(component) {
    if (component.publicPath) {
      $.getScript(component.publicPath, (data, textStatus, jqxhr) => {
        console.log('addComponents | textStatus, jqxhr:', textStatus, jqxhr);
        var componentConstructor = getComponentConstructor(component.name);

        if (typeof componentConstructor === 'function') {
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
    
    console.log('idx, arrangement:', idx, arrangement, window.ocularisComponents);
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
