import Director from '../world/director';
import Light from '../world/light';
import Scene from '../world/scene';
import Camera from '../world/camera';
import {
  loadSettings
} from '../helpers/routes';

// Render component preview
export default function(options) {
  let self = { update: true };
  let scene = Scene();
  let director = Director();
  let renderer = new THREE.WebGLRenderer();
  let $container = options.$container;
  let width = $container.width();
  let height = $container.height();
  let camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
  
  director.initPreview(scene, camera);
  options.component.preview = true;
  scene.add(Light());
  director.addComponent(options.component, () => self.update = true);
  renderer.setSize(width, height);
  $container.html(renderer.domElement);

  // Draw component preview
  let draw = function() {
    requestAnimationFrame(draw);
    if (self.update) {
      self.update = false;
      renderer.render(scene, camera);
    }
  };
  draw();
}



