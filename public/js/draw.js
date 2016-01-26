OCULARIS.draw = function () {
  var engine = OCULARIS.engine;
  function draw () {
    requestAnimationFrame(draw);
    
    if (engine.VREnabled) {
      engine.VRControls.update();
      engine.VREffect.render(engine.scene, engine.camera);
      engine.motion.update();
    }
    else {
      engine.motion.update();
	  if (engine.frameUpdate) {
        console.log('engine.frameUpdate:', engine.frameUpdate)
	    engine.frameUpdate = false;
        engine.renderer.render(engine.scene, engine.camera);	
	  }
	  
    }

  }
  return draw;
}
