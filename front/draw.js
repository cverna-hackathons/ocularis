module.exports = function(camera, renderer, scene) {
  return function draw() {
    requestAnimationFrame(draw);
    renderer.render(scene, camera);
  }
}
