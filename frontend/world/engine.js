import {
  getFacesToCamera
} from '../helpers/transforms.js';

import Light from './light.js';
import Scene from './scene.js';
import Renderer from './renderer.js';
import Draw from './draw.js';
import View from './view.js';
import Events from './events.js';
import VRHandlers_ from './vr-handlers.js';

export default function() {

  var context = this;

  var models = [];

  var VREnabled = false;

  var scene = Scene();

  var renderer = Renderer();

  var view = null;

  var events = null;

  var VRHandlers = null;

  var frameUpdate = true;

  var camera = null;

  // init();

  function init() {
    view = View(this);
    events = Events();
    scene.add(Light());
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
    models.forEach((model) => {
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
    init,
    draw,
    switchVR,
    enableVR,
    disableVR,
    update,
    getVREnabled,
    getFrameUpdate,
    setFrameUpdate,
    setCamera,
    getRenderer,
    getView
  };

}
