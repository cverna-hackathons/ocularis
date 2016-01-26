var OCULARIS = {
  models: {},
  twitter: {}
};

OCULARIS.engine = (function() {
  var ENGINE = {
    init: function () {
      var box   = OCULARIS.models.box();

      ENGINE.VREnabled= false
      ENGINE.light    = OCULARIS.light();
      ENGINE.scene    = OCULARIS.scene();
      ENGINE.renderer = OCULARIS.renderer();
      ENGINE.motion   = OCULARIS.motion();
      ENGINE.draw     = OCULARIS.draw();
      ENGINE.view     = OCULARIS.view();

      ENGINE.view.reset();
      ENGINE.scene.add(box);
      ENGINE.scene.add(ENGINE.light);

      //RENDER test tweet feed -> it will be triggered differently
      OCULARIS.twitter.feed(function (err, objects) {
        objects.forEach(function (obj) {
          ENGINE.scene.add(obj);
          ENGINE.frameUpdate = true;
        });
      });

      $('#scene').html(ENGINE.renderer.domElement);
      ENGINE.draw();
      setTriggers();
    },
    switchVR: function () {
      ENGINE.VREnabled = !ENGINE.VREnabled;
      ENGINE.view.reset();
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
        OCULARIS.engine.resetView();
        break;
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
    $("body").on("keypress", trackKeys);
    $("body").on("keyup", untrackKeys);
  }

  return ENGINE;
})();

$(document).ready(OCULARIS.engine.init);