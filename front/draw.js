module.exports = function (ENGINE) {
  function draw () {
    requestAnimationFrame(draw);
    ENGINE.motion.update();
    if (ENGINE.frameUpdate) {
      ENGINE.frameUpdate = false;
      ENGINE.renderer.render(ENGINE.scene, ENGINE.camera);
    }
  }
  return draw;
}
