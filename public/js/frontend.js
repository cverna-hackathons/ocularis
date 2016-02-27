'use strict';

function Light() {
  return new THREE.AmbientLight(0xeeeeee);
}

function Scene() {
  return new THREE.Scene();
}

function Renderer() {
  var renderer = new THREE.WebGLRenderer({});
  renderer.setPixelRatio(window.devicePixelRatio);

  return renderer;
}

function Draw(engine, scene, camera, VRHandlers, renderer) {

  return function draw(timeStamp) {
    requestAnimationFrame(draw);

    if (engine.getVREnabled()) {
      VRHandlers.VRControls.update();
      VRHandlers.VRManager.render(scene, camera, timeStamp);
      VRHandlers.VREffect.render(scene, camera);
      engine.update();
    } else {
      engine.update();
      if (engine.getFrameUpdate()) {
        engine.setFrameUpdate(false);
        renderer.render(scene, camera);
      }
    }
  };
}

function Camera() {

  var config = {
    FOV: 75,
    CUTOFF: 0.1,
    ASPECT_RATIO: window.innerWidth / window.innerHeight,
    TARGET_DISTANCE: 10000
  };

  return new THREE.PerspectiveCamera(config.FOV, config.ASPECT_RATIO, config.CUTOFF, config.TARGET_DISTANCE);
}

function View(engine) {

  function reset() {
    engine.setCamera(Camera());
    engine.setFrameUpdate(true);

    if (engine.getVREnabled()) {
      engine.enableVR();
    } else {
      engine.disableVR();
    }
  }

  return {
    reset: reset
  };
}

function Events() {
  var listeners = {};

  function getEventKeyDirection(event, trigger) {
    console.log('getEventKeyDirection | event.keyCode:', event.keyCode, trigger);
    var key;
    switch (event.keyCode) {
      // W-key
      // ArrowUp
      case 38:
        key = 'forward';
        break;
      // ArrowDown
      case 40:
        key = 'backward';
        break;
      // ArrowLeft
      case 37:
        key = 'left';
        break;
      // ArrowRight
      case 39:
        key = 'right';
        break;
      // Spacebar press
      case 32:
        key = 'spacebar';
        break;
      case 13:
        key = 'enter';
        break;
      case 90:
        key = 'z';
        break;
    }
    return key;
  }

  function trackKeys(event) {
    triggerKeyEvent(getEventKeyDirection(event, 'keydown'));
  }

  function setTriggers() {
    $("body").on("keydown", trackKeys);
  }

  function triggerKeyEvent(key) {
    if (listeners[key]) {
      listeners[key].forEach(function (obj) {
        obj.callback();
      });
    }
  }

  function addEventListener(key, done, id) {
    if (!listeners[key]) {
      listeners[key] = [];
    }

    if (!id) {
      id = Date.now();
    }

    listeners[key].push({
      callback: done,
      id: id
    });
    return id;
  }

  function removeEventListener(id) {
    for (var key in listeners) {
      for (var i = 0, len = listeners[key].length; i < len; i++) {
        if (listeners[key][i].id === id) {
          listeners[key].splice(i, 1);
        }
      }
    }
  }

  setTriggers();

  return {
    getListeners: function getListeners() {
      return listeners;
    },
    addEventListener: addEventListener,
    removeEventListener: removeEventListener
  };
}

function VRHandlers_(camera, renderer) {

  var VRControls = new THREE.VRControls(camera);
  var VREffect = new THREE.VREffect(renderer);
  VREffect.setSize(window.innerWidth, window.innerHeight);
  var VRManager = new WebVRManager(renderer, VREffect, {
    hideButton: false,
    isUndistorted: false
  });

  return {
    VRControls: VRControls,
    VREffect: VREffect,
    VRManager: VRManager,
    disable: function disable() {
      this.VRControls = null;
      this.VREffect = null;
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  };
}

function DummyBox(opt) {
  opt = _.defaults(opt || {}, {
    x: 0,
    y: -1,
    z: -1,
    size: {
      width: 0.1,
      height: 0.1,
      depth: 0.1
    },
    material: new THREE.MeshBasicMaterial({ color: 'red' })
  });

  var geometry = new THREE.CubeGeometry(opt.size.width, opt.size.height, opt.size.depth);
  var box = new THREE.Mesh(geometry, opt.material);

  box.position.x = opt.x;
  box.position.y = opt.y;
  box.position.z = opt.z;

  return box;
}

function Engine() {

  var context = this;

  var models = [];

  var VREnabled = true;

  var scene = Scene();

  var renderer = Renderer();

  var view = null;

  var events = null;

  var VRHandlers = null;

  var frameUpdate = true;

  var camera = null;

  function init() {
    view = View(this);
    events = Events();
    scene.add(Light());
    scene.add(DummyBox());
  }

  function draw() {
    Draw(this, scene, camera, VRHandlers, renderer)();
  }

  function switchVR() {
    VREnabled = !VREnabled;
    view.reset();
    console.log('Switching VR');
  }

  function enableVR() {
    VRHandlers = VRHandlers_(camera, renderer);
  }

  function resetVRSensor() {
    VRHandlers.VRControls.resetSensor();
  }

  function disableVR() {
    if (VRHandlers) {
      VRHandlers.disable();
    }
  }

  function update() {
    models.forEach(function (model) {
      if (model.active && model.checkUpdate()) {
        frameUpdate = true;
      }
    });
  }

  function getVREnabled() {
    return VREnabled;
  }

  function getFrameUpdate() {
    return frameUpdate;
  }

  function setFrameUpdate(bool) {
    frameUpdate = bool;
  }

  function setCamera(_camera) {
    camera = _camera;
  }

  function getRenderer() {
    return renderer;
  }

  function getView() {
    return view;
  }

  return {
    init: init,
    draw: draw,
    switchVR: switchVR,
    enableVR: enableVR,
    disableVR: disableVR,
    update: update,
    getVREnabled: getVREnabled,
    getFrameUpdate: getFrameUpdate,
    setFrameUpdate: setFrameUpdate,
    setCamera: setCamera,
    getRenderer: getRenderer,
    getView: getView
  };
}

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
