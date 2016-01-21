OCULARIS.draw = function () {
  var engine = OCULARIS.engine;
  function draw () {
    requestAnimationFrame(draw);
    engine.motion.update();

    if (engine.frameUpdate) {
    	engine.frameUpdate = false;
	    if ( engine.VREnabled) {
	      console.log('engine.frameUpdate:', engine.frameUpdate)
	      engine.VRControls.update();
	      engine.VREffect.render(engine.scene, engine.camera);
	    }
	    else {
	      engine.renderer.render(
	        engine.scene, engine.camera
	      );
	    }
    }

  }
  return draw;
}
