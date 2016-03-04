'use strict';

function Scene() {
  return new THREE.Scene();
}

function Light() {
  return new THREE.AmbientLight(0xeeeeee);
}

function Pivot(opt) {
  opt = _.defaults(opt || {}, {
    size: {
      width: .1,
      height: .1,
      depth: .1
    },
    position: {
      x: 0,
      y: -1,
      z: -2.5
    },
    material: new THREE.MeshBasicMaterial({ color: 'red' })
  });

  var geometry = new THREE.CubeGeometry(opt.size.width, opt.size.height, opt.size.depth);
  var box = new THREE.Mesh(geometry, opt.material);

  box.position.x = opt.position.x;
  box.position.y = opt.position.y;
  box.position.z = opt.position.z;

  return box;
}

function loadSettings(done) {
  $.get('/load_settings', function (response) {
    if (response && response.settings) {
      return done(null, response.settings);
    } else return done('Unable to load user configuration.');
  });
}

function Director() {

  /**
   * Initialize the objects in scene
   * @param  {THREE.js scene} object
   * @return {void}
   */
  function init(scene) {

    scene.add(Light());
    // Add basic pivot object to the scene (red box)
    scene.add(Pivot());

    // XXX: Remove after config load
    // var cube = Cube();
    // // Create a bounding box for size assessment
    // var boundingBox = new THREE.Box3().setFromObject(cube.component)

    // XXX: Print out the size of our bounding box
    // scene.add(cube.component);
    // console.log(boundingBox.size())

    addComponents(scene);
  }

  function addComponents(scene) {
    initializeComponentContainers();
    console.log('loading addComponents');
    loadSettings(function (errs, settings) {
      if (!errs) {
        settings.components.forEach(function (component) {
          addComponent(component, scene);
        });
      }
    });
  }

  function initializeComponentContainers() {
    window.ocularisComponents = [];
    window.ocularisComponentConstructors = [];
  }

  function addComponent(component, scene) {
    console.log('addComponents | component:', component);
    if (component.publicPath) {
      $.getScript(component.publicPath, function (data, textStatus, jqxhr) {
        console.log('addComponents | textStatus, jqxhr:', textStatus, jqxhr);
        var componentConstructor = getComponentConstructor(component.name);

        if (typeof componentConstructor === 'function') {
          console.log('found constructor');
          var instance = componentConstructor(component.id || Date.now());
          scene.add(instance.component);
        } else console.warn('Loaded object is not a constructor function!', componentConstructor);
      });
    }
  }

  function getComponentConstructor(name) {
    var hit;
    var constructors = window.ocularisComponentConstructors || [];

    for (var i = 0; i < constructors.length; i++) {
      var candidate = constructors[i];
      console.log('candidate:', candidate);
      if (candidate && candidate.name === name && candidate._constructor) {
        hit = candidate._constructor;
        break;
      }
    }
    return hit;
  }

  return {
    init: init,
    addComponents: addComponents,
    addComponent: addComponent
  };
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
  var VRManager = new WebVRManager(renderer, VREffect, {
    hideButton: false,
    isUndistorted: false
  });

  // UNTESTED: Moved after VRManager declaration
  VREffect.setSize(window.innerWidth, window.innerHeight);

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

  var director = null;

  function init() {
    view = View(this);
    events = Events();
    director = Director(this);
    director.init(scene);

    return this;
  }

  function draw() {
    Draw(this, scene, camera, VRHandlers, renderer)();
  }

  function switchVR() {
    VREnabled = !VREnabled;
    view.reset();
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
  var engine = Engine().init();

  WebVRConfig = {
    ORCE_ENABLE_VR: false
  };

  $('#scene').html(engine.getRenderer().domElement);
  engine.getView().reset();
  engine.draw();
}

$(document).ready(init);
