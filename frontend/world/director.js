import Light from './light';
//Test fixture
import Pivot from '../components/pivot';
// import Routes from '../helpers/routes.js';
// XXX: Simple text cube component test
import Cube from '../components/text-cube';

export default function(engine) {

  /**
   * Initialize the objects in scene
   * @param  {THREE.js scene} object
   * @return {void}
   */
  function init(scene) {
    // XXX: Remove after config load
    var cube = Cube();
    // Create a bounding box for size assessment
    var boundingBox = new THREE.Box3().setFromObject(cube.component)

    // XXX: Print out the size of our bounding box
    console.log(boundingBox.size())

    scene.add(Light());
    // Add basic pivot object to the scene (red box)
    scene.add(Pivot());
    scene.add(cube.component);
  }

  function loadConfig() {

  }

  return {
    init: init
  };
}
