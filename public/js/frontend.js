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

/**
 * Create multi mesh material for a cube.
 * @param  {options}    object with options for material generation
 * @return {materials}  array of materials for a cube
 */
function createCubeMaterials(options) {
  var materials = [];

  for (var materialIdx = 0; materialIdx < 6; materialIdx++) {
    var materialOptions = {
      color: options.color,
      map: buildTextureFromText(options.text, 512)
    };
    materials.push(new THREE.MeshBasicMaterial(materialOptions));
  }
  return materials;
}

// Add texture here to return for material
function buildTextureFromText(text, size) {

  var texture = new THREE.Texture(getCanvasWithTextWrap(text, {
    maxWidth: size
  }));
  texture.needsUpdate = true;
  return texture;
}

function getCanvasWithTextWrap(text, options) {

  var i, j, lines, lineSpacing, projectedHeight;
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var width = 0;
  var fontSize = options.fontSize || 50;
  var fontFace = options.fontFace || 'Arial';
  var maxWidth = options.maxWidth || 512;
  var fontColor = options.fontColor || "#000000";
  var background = options.background || "#ffffff";

  ctx.canvas.width = maxWidth;
  ctx.canvas.height = maxWidth;

  do {
    // Calculate canvas size, add margin
    adjustToFontSize();
    fontSize--;
  } while (fontSize > 0 && projectedHeight > options.maxWidth);

  // since we are in a cube, we use the same height and width
  ctx.font = fontSize + "px Arial";

  // Render
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = fontColor;
  j = lines.length;

  for (i = 0; i < j; i++) {
    ctx.fillText(lines[i], lineSpacing, (fontSize + lineSpacing) * (i + 1));
  }

  return canvas;

  function adjustToFontSize() {
    var textCopy = '' + text;
    var len = textCopy.length;
    var result;

    lineSpacing = parseInt(fontSize / 2);
    projectedHeight = lineSpacing;
    lines = new Array();

    // Measure text and calculate width
    // Font and size is required for ctx.measureText()
    ctx.font = fontSize + 'px ' + fontFace;

    while (textCopy.length) {
      for (i = len; ctx.measureText(textCopy.substr(0, i)).width + lineSpacing > maxWidth; i--) {}
      result = textCopy.substr(0, i);

      if (i !== textCopy.length) for (j = 0; result.indexOf(" ", j) !== -1; j = result.indexOf(" ", j) + 1) {}

      lines.push(result.substr(0, j || result.length));
      width = Math.max(width, ctx.measureText(lines[lines.length - 1]).width);
      textCopy = textCopy.substr(lines[lines.length - 1].length, textCopy.length);
      projectedHeight += fontSize + lineSpacing;
    }
  }
}

function Cube(opt) {

  var defined = {
    'version': 1,
    'drawables': [{ 'name': 'Main text', 'id': 'main', 'draw_types': ['text', 'image'] }],
    'events': [{ 'name': 'Draw next', 'id': 'next', 'key': 'forward' }, { 'name': 'Draw previous', 'id': 'previous', 'key': 'backward' }, { 'name': 'Switch left', 'id': 'switchLeft', 'key': 'left' }, { 'name': 'Switch right', 'id': 'switchRight', 'key': 'right' }]
  };

  opt = _.defaults(opt || {}, {
    size: {
      width: 1,
      height: 1,
      depth: 1
    },
    position: {
      x: 0,
      y: -1,
      z: -2.5
    }
  });

  var geometry = new THREE.CubeGeometry(opt.size.width, opt.size.height, opt.size.depth);

  var materials = createCubeMaterials({
    color: 0xcccccc,
    text: 'text-cube'
  });
  console.log(geometry);
  var box = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));

  box.position.x = opt.position.x;
  box.position.y = opt.position.y;
  box.position.z = opt.position.z;

  var drawables = {
    main: function main(input) {}
  };

  /**
   * Draw incoming data. (For each output draw on the associated drawable)
   * @param  {outputs: [],... } object
   * @param  {event: object, callback: fn} object
   * @return {void}
   */
  function redraw(data, optional) {
    data.outputs.forEach(drawOutput);
  }

  /**
   * Draw data point value onto drawable.
   * @param  { value: '', drawableId: String, draw_type: String} object
   * @return {void}
   */
  function drawOutput(data) {
    if (data.drawableId && draw[data.drawableId]) {
      drawables[data.drawableId](data);
    }
  }

  return {
    defined: defined,
    redraw: redraw,
    object: box
  };
}

function Director(engine) {

  function init(scene) {
    var cube = Cube();

    console.log(cube);
    scene.add(Light());
    scene.add(Pivot());
    scene.add(cube.object);
  }

  return {
    init: init
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
