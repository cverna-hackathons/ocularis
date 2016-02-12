OCULARIS.events = function() {
  
  var listeners = {};

  function getEventKeyDirection (event, trigger) {
    console.log('getEventKeyDirection | event.keyCode:', event.keyCode, trigger);
    var direction;
    switch (event.keyCode) {
      // W-key
      // ArrowUp
      case 38:
        direction = 'forward';
        break;
      // ArrowDown
      case 40:
        direction = 'backward';
        break;
      // ArrowLeft
      case 37:
        direction = 'left';
        break;
      // ArrowRight
      case 39:
        direction = 'right';
        break;
      // Spacebar press
      case 32:
        if (trigger === 'keyup') ENGINE.view.reset();
        break;
      // Enter press
      case 13:
        if (trigger === 'keyup') OCULARIS.engine.switchVR();
        break;
    }
    return direction;
  }

  function trackKeys (event) {
    var direction = getEventKeyDirection(event, 'keydown');

    if (direction && direction !== 'reset') {
      ENGINE.motion.incite(direction);
    }
  }

  function untrackKeys (event) {
    var direction = getEventKeyDirection(event, 'keyup');

    if (direction) {
      ENGINE.motion.impede(direction);
    }
  }

  function setTriggers () {
    $("body").on("keydown", trackKeys);
    $("body").on("keyup", untrackKeys);
  }

  function addEventListener(key, done) {

  }

  return {
    addEventListener: addEventListener
  };
};