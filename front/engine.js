module.exports = (() => {

  let ENGINE = {
    init: () => {
      const COMPONENTS = ['scene', 'camera', 'renderer'];

      let light = require('./light');
      let box   = require('./models/box');
      let bb    = box();

      ENGINE.resetView();
      ENGINE.scene    = require('./scene')(ENGINE);
      ENGINE.renderer = require('./renderer')(ENGINE);
      ENGINE.motion   = require('./motion')(ENGINE);
      ENGINE.draw     = require('./draw')(ENGINE);
      ENGINE.floor    = require('./floor')(ENGINE);
      ENGINE.scene.add(bb);
      ENGINE.scene.add(light);
      ENGINE.scene.add(ENGINE.floor);
      

      $('#scene').html(ENGINE.renderer.domElement);
      ENGINE.draw();

      $(document).ready(setTriggers);
    },
    resetView: () => {
      ENGINE.camera = require('./camera')(ENGINE);
      ENGINE.frameUpdate = true;
    }
  };
  let getEventKeyDirection = (event) => {
    console.log('getEventKeyDirection | event.keyCode:', event.keyCode)
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
      case 32:
        direction = 'reset';
        break;
    }
    return direction;
  };
  let trackKeys = event => {
    let direction = getEventKeyDirection(event);

    if (direction && direction !== 'reset') 
      ENGINE.motion.incite(direction);
  };

  let untrackKeys = event => {
    let direction = getEventKeyDirection(event)

    if (direction) 
      ENGINE.motion.impede(direction)
  };

  let setTriggers = () => {
    $("body").on("keypress", trackKeys)
    $("body").on("keyup", untrackKeys)
  };

  ENGINE.init();

  return ENGINE;
})();


