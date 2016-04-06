export default function() {
  let renderer = new THREE.WebGLRenderer({ alpha: true });
  // renderer.setPixelRatio(window.devicePixelRatio);

  return renderer;
}
