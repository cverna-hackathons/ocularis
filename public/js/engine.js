var OCULARIS = {
  model: {},
  component: {}
};

OCULARIS.engine = (function() {
  var ENGINE = {
    models: [],
    init: function () {
      var redBox   = OCULARIS.component.pointer();

      ENGINE.VREnabled= false
      ENGINE.light    = OCULARIS.light();
      ENGINE.scene    = OCULARIS.scene();
      ENGINE.renderer = OCULARIS.renderer();
      ENGINE.motion   = OCULARIS.motion();
      ENGINE.draw     = OCULARIS.draw();
      ENGINE.view     = OCULARIS.view();
      ENGINE.content  = OCULARIS.content();

      ENGINE.view.reset();
      ENGINE.scene.add(redBox);
      ENGINE.scene.add(ENGINE.light);
      ENGINE.content.init();

      $('#scene').html(ENGINE.renderer.domElement);
      ENGINE.draw();
      setTriggers();
    },
    switchVR: function () {
      ENGINE.VREnabled = !ENGINE.VREnabled;
      ENGINE.view.reset();
      console.log('switching to VR:', ENGINE.VREnabled)
    },
    enableVR: function () {
      ENGINE.VRControls = new THREE.VRControls(ENGINE.camera);
      ENGINE.VREffect   = new THREE.VREffect(ENGINE.renderer);

      ENGINE.VREffect.setSize(window.innerWidth, window.innerHeight);
    },
    disableVR: function () {
      ENGINE.VRControls = null;
      ENGINE.VREffect   = null;
      ENGINE.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  };

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

  return ENGINE;
})();

$(document).ready(OCULARIS.engine.init);