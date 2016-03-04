import Light from './light';
import Pivot from '../dummies/pivot';
import {
  loadSettings
} from '../helpers/routes';


export default function() {

  /**
   * Initialize the objects in scene
   * @param  {THREE.js scene} object
   * @return {void}
   */
  function init(scene) {

    scene.add(Light());
    // Add basic pivot object to the scene (red box)
    scene.add(Pivot());

    // XXX: Remove after config load
    // var cube = Cube();
    // // Create a bounding box for size assessment
    // var boundingBox = new THREE.Box3().setFromObject(cube.component)

    // XXX: Print out the size of our bounding box
    // scene.add(cube.component);
    // console.log(boundingBox.size())

    addComponents(scene);

  }

  function addComponents(scene) {
    initializeComponentContainers();
    console.log('loading addComponents');
    loadSettings((errs, settings) => {
      if (!errs) {
        settings.components.forEach(component => {
          addComponent(component, scene);
        });
      }
    });
  }

  function initializeComponentContainers() {
    window.ocularisComponents = [];
    window.ocularisComponentConstructors = [];
  }

  function addComponent(component, scene) {
    console.log('addComponents | component:', component);
    if (component.publicPath) {
      $.getScript(component.publicPath, (data, textStatus, jqxhr) => {
        console.log('addComponents | textStatus, jqxhr:', textStatus, jqxhr);
        var componentConstructor = getComponentConstructor(component.name);

        if (typeof componentConstructor === 'function') {
          console.log('found constructor')
          var instance = componentConstructor(component.id || Date.now());
          scene.add(instance.component);
        }
        else console.warn(
          'Loaded object is not a constructor function!', componentConstructor
        );
      });
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
    addComponent: addComponent
  };
}
