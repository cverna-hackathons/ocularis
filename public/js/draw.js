OCULARIS.draw = function () {
  function draw (timeStamp) {
    var engine = OCULARIS.engine;
    requestAnimationFrame(draw);
    if (engine.VREnabled) {
      engine.VRControls.update();
      engine.VRManager.render(engine.scene, engine.camera, timeStamp);
      engine.VREffect.render(engine.scene, engine.camera);
      engine.update();
    }
    else {
      engine.update();
      engine.motion.update();
      if (engine.frameUpdate) {
        engine.frameUpdate = false;
        engine.renderer.render(engine.scene, engine.camera);
      }
    }

  }
  return draw;
}
