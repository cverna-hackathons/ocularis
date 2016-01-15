module.exports = (function() {

  var config = {
    FOV: 100,
    CUTOFF: 0.1,
    ASPECT_RATIO: window.innerWidth / window.innerHeight,
    TARGET_DISTANCE: 1000,
    INIT_POS: {
      x: 0,
      y: 0,
      z: 20
    }
  };

  var camera = new THREE.PerspectiveCamera(
    config.FOV, config.ASPECT_RATIO, config.CUTOFF, config.TARGET_DISTANCE
  );

  camera.position.set(config.INIT_POS.x, config.INIT_POS.y, config.INIT_POS.z);
  camera.lookAt({
    x: 0,
    y: 0,
    z: -10
  });

  return camera;

})();
