import Engine from './world/engine.js';

function init() {
  WebVRConfig = {
    ORCE_ENABLE_VR: false
  };

  var engine = Engine();
  engine.init();

  $('#scene').html(engine.getRenderer().domElement);
  engine.getView().reset();
  engine.draw();
}

$(document).ready(init);
