var OCULARIS = {
  model: {},
  component: {},
  init: function() {
  	WebVRConfig = {
      ORCE_ENABLE_VR: false
  	};
    OCULARIS.engine = OCULARIS.createEngine();
    $('#scene').html(OCULARIS.engine.renderer.domElement);
    OCULARIS.engine.view.reset();
    OCULARIS.engine.draw();
  }
};

$(document).ready(OCULARIS.init);
