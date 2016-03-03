import Light from './light';
//Test fixture
import Pivot from '../dummies/pivot';
// XXX: Simple text cube component test
// import Cube from '../sandbox/ocularis-cube.js'

export default function(engine) {

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
    window.ocularisComponents = [];
    loadConfig((errs, config) => {
      if (!errs) config.components.forEach(component => {
        if (component.publicUrl) {
          console.log('loading addComponents')
          $.getScript(component.publicUrl, (data, textStatus, jqxhr) => {
            //console.log('addComponents | data:', data);
            console.log('addComponents | load | textStatus:', textStatus);
            var instance = getComponent(component.name);

            if (instance && instance.component) scene.add(instance.component);
          });
        }
      });
    });
  }

  function getComponent(name) {
    var hit;

    for (var i = 0; i < (window.ocularisComponents || []).length; i++) {
      var candidate = window.ocularisComponents[i];
      console.log('candidate:', candidate);
      if (candidate && candidate.name === name) {
        hit = candidate;
        break;
      }
    }
    return hit;
  }

  // WIP: Makeshift for now, will need to suck from backend
  function loadConfig(done) {
    return done(null, {
      components: [ { name: 'ocularis-cube', publicUrl: 'sandbox/ocularis-cube.js' } ]
    });
  }

  return {
    init: init
  };
}
