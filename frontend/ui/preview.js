import Director from '../world/director';
import Light from '../world/light';
import Scene from '../world/scene';
import Camera from '../world/camera';
import {
  loadSettings
} from '../helpers/routes';

// Render component preview
export default function(options) {
  let self = {
    update: true
  }
  let director = Director();
  let scene = Scene();
  let renderer = new THREE.WebGLRenderer();
  let width = options.$container.width();
  let height = options.$container.height();
  let camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);

  console.log('preview component | width, height:', width, height);
  
  scene.add(Light());
  director.addComponent(options.component, scene);
  renderer.setSize( width, height );
  options.$container.html(renderer.domElement);

  // Draw component preview
  let draw = function() {
    renderer.render(scene, camera);
    if (self.update) {
      self.update = false;
      requestAnimationFrame(draw);
    }
  }

  draw();
}



