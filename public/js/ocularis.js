var OCULARIS = {
  model: {},
  component: {},
  init: function() {
    OCULARIS.engine = OCULARIS.createEngine();
    $('#scene').html(OCULARIS.engine.renderer.domElement);
    OCULARIS.engine.view.reset();
    OCULARIS.engine.draw();
  }
};

$(document).ready(OCULARIS.init);
