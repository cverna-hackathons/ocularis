import {
  getFacesToCamera
} from '../helpers/transforms';

import Scene from './scene';
import Director from './director';
import Renderer from './renderer';
import Draw from './draw';
import View from './view';
import Events from './events';
import VRHandlers_ from './vr-handlers';

export default function() {

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
    director.init();

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
    director.checkForUpdates();
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

  function getScene() {
    return scene;
  }

  function getCamera() {
    return camera;
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
    getView,
    getCamera,
    getScene
  };

}
