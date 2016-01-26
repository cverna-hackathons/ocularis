OCULARIS.view = function () {
  var ENGINE = OCULARIS.engine;

  function reset() {
    ENGINE.camera       = OCULARIS.camera();
    ENGINE.frameUpdate  = true;
    if (ENGINE.VREnabled)
      ENGINE.enableVR();
    else
      ENGINE.disableVR();
  }

  function closeTo(element) {
    
  }

  return {
    reset: reset,
    closeTo: closeTo
  }
};