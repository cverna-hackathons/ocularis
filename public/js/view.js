OCULARIS.view = function () {

  function reset() {
    OCULARIS.engine.camera       = OCULARIS.camera();
    OCULARIS.engine.frameUpdate  = true;
    if (OCULARIS.engine.VREnabled)
      OCULARIS.engine.enableVR();
    else
      OCULARIS.engine.disableVR();
  }

  return {
    reset: reset
  };
};