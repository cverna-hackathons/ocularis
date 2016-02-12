var OCULARIS = {
  model: {},
  component: {},
  init: function() {
    OCULARIS.engine = OCULARIS.createEngine();
    $('#scene').html(OCULARIS.engine.renderer.domElement);
  }
};

$(document).ready(OCULARIS.init);