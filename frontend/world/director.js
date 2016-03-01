import Light from './light.js';
//Test fixture
import Pivot from '../components/pivot.js';
// XXX: Simple text cube component test
import Cube from '../components/text-cube.js';

export default function(engine) {

  function init(scene) {
    var cube = Cube();

    console.log(cube)
    scene.add(Light());
    scene.add(Pivot());
    scene.add(cube.object);
  }

  return {
    init: init
  };
}
