module.exports = function(camera, renderer, scene) {
  return function fuck() {
    requestAnimationFrame(fuck);
    renderer.render(scene, camera);
  }
}
