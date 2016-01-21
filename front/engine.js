module.exports = (function() {

  var ENGINE = {
    init: function () {
      const COMPONENTS = ['scene', 'camera', 'renderer'];

      var light = require('./light');
      var box   = require('./models/box');
      var bb    = box();

      ENGINE.resetView();
      ENGINE.scene    = require('./scene')(ENGINE);
      ENGINE.renderer = require('./renderer')(ENGINE);
      ENGINE.motion   = require('./motion')(ENGINE);
      ENGINE.draw     = require('./draw')(ENGINE);
      ENGINE.scene.add(bb);
      ENGINE.scene.add(light);

      //RENDER test tweet feed -> it will be triggered differently
      require('./twitter/feed')(null, function (err, objects) {
        objects.forEach(function (obj) {
          ENGINE.scene.add(obj);
          ENGINE.frameUpdate = true;
        });
      });

      $('#scene').html(ENGINE.renderer.domElement);
      ENGINE.draw();

      $(document).ready(setTriggers);
    },
    resetView: function () {
      ENGINE.camera = require('./camera')(ENGINE);
      ENGINE.frameUpdate = true;
    }
  };
  var getEventKeyDirection = function (event) {
    console.log('getEventKeyDirection | event.keyCode:', event.keyCode);
    var direction;
    switch (event.keyCode) {
      case 38:
        direction = 'forward';
        break;
      case 40:
        direction = 'backward';
        break;
      case 37:
        direction = 'left';
        break;
      case 39:
        direction = 'right';
        break;
      case 32:
        direction = 'reset';
        break;
    }
    return direction;
  };
  var trackKeys = function (event) {
    var direction = getEventKeyDirection(event);

    if (direction && direction !== 'reset') 
      ENGINE.motion.incite(direction);
  };

  var untrackKeys = function (event) {
    var direction = getEventKeyDirection(event);

    if (direction) 
      ENGINE.motion.impede(direction);
  };

  var setTriggers = function () {
    $("body").on("keypress", trackKeys);
    $("body").on("keyup", untrackKeys);
  };

  ENGINE.init();

  return ENGINE;
})();
