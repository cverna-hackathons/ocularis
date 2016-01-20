module.exports = (() => {

  let ENGINE = {
    init: () => {
      const COMPONENTS = ['scene', 'camera', 'renderer'];

      let light = require('./light');
      let box   = require('./models/box');
      let bb    = box();

      ENGINE.camera   = require('./camera')(ENGINE);
      ENGINE.scene    = require('./scene')(ENGINE);
      ENGINE.renderer = require('./renderer')(ENGINE);
      ENGINE.motion   = require('./motion')(ENGINE);
      ENGINE.draw     = require('./draw')(ENGINE);
      
      ENGINE.scene.add(bb);
      ENGINE.scene.add(light);
      ENGINE.frameUpdate = true;

      $('#scene').html(ENGINE.renderer.domElement);
      ENGINE.draw();

      $(document).ready(setTriggers)
    }
  };
  let getEventKeyDirection = (event) => {
    let direction;
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
    }
    return direction;
  }
  let trackKeys = event => {
    let direction = getEventKeyDirection(event);

    if (direction) ENGINE.motion.incite(direction);
  };

  let untrackKeys = event => {
    let direction = getEventKeyDirection(event)

    if (direction) ENGINE.motion.impede(direction)
  };

  let setTriggers = () => {
    $("body").on("keypress", trackKeys)
    $("body").on("keyup", untrackKeys)
  };

  ENGINE.init();

  return ENGINE;
})();


