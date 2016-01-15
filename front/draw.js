module.exports = function(camera, renderer, scene) {
  return function() {
    console.log('draw init')
    renderer.render(scene, camera);
  }
}
