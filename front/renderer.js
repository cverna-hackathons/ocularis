module.exports = (function() {

  var renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });

  renderer.shadowMapSoft = true;

  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.setClearColor(0x000000, 1);

  return renderer;
})();
