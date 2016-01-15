"use strict";

(function e(t, n, r) {
  function s(o, u) {
    if (!n[o]) {
      if (!t[o]) {
        var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);throw new Error("Cannot find module '" + o + "'");
      }var f = n[o] = { exports: {} };t[o][0].call(f.exports, function (e) {
        var n = t[o][1][e];return s(n ? n : e);
      }, f, f.exports, e, t, n, r);
    }return n[o].exports;
  }var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) {
    s(r[o]);
  }return s;
})({ 1: [function (require, module, exports) {
    module.exports = function () {

      var config = {
        FOV: 100,
        CUTOFF: 0.1,
        ASPECT_RATIO: window.innerWidth / window.innerHeight,
        TARGET_DISTANCE: 100,
        INIT_POS: {
          x: 0,
          y: 0,
          z: 50
        }
      };

      var camera = new THREE.PerspectiveCamera(config.FOV, config.ASPECT_RATIO, config.CUTOFF, config.TARGET_DISTANCE);

      camera.position.set(config.INIT_POS);
      camera.lookAt({
        x: 0,
        y: 0,
        z: 0
      });

      return camera;
    }();
  }, {}], 2: [function (require, module, exports) {
    module.exports = function (camera, renderer, scene) {
      return function fuck() {
        requestAnimationFrame(fuck);
        renderer.render(scene, camera);
      };
    };
  }, {}], 3: [function (require, module, exports) {
    var scene = require('./scene');
    var renderer = require('./renderer');
    var camera = require('./camera');
    var light = require('./light');
    var draw = require('./draw')(camera, renderer, scene);

    var box = require('./models/box');

    $('#scene').html(renderer.domElement);

    var bb = box();

    scene.add(bb);
    scene.add(light);

    requestAnimationFrame(draw);
  }, { "./camera": 1, "./draw": 2, "./light": 4, "./models/box": 5, "./renderer": 6, "./scene": 7 }], 4: [function (require, module, exports) {
    module.exports = function () {
      var ambient = new THREE.AmbientLight(0x666666);

      return ambient;
    }();
  }, {}], 5: [function (require, module, exports) {
    module.exports = function (opt) {
      opt = _.defaults(opt || {}, {
        x: 0,
        y: 0,
        z: 0,
        size: {
          width: 1,
          height: 1,
          depth: 1
        },
        material: new THREE.MeshLambertMaterial({ color: 0xffffff })
      });

      return new THREE.Mesh(new THREE.BoxGeometry(opt.size.width, opt.size.height, opt.size.depth), opt.material);
    };
  }, {}], 6: [function (require, module, exports) {
    module.exports = function () {

      var renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      });

      renderer.shadowMapSoft = true;

      renderer.setSize(window.innerWidth, window.innerHeight);

      renderer.setClearColor(0x000000, 1);

      return renderer;
    }();
  }, {}], 7: [function (require, module, exports) {
    module.exports = function () {

      var scene = new THREE.Scene();

      return scene;
    }();
  }, {}] }, {}, [3]);