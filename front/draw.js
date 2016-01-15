module.exports = function(camera, renderer, scene) {
  return function() {
    renderer.render(scene, camera);
  }
}
