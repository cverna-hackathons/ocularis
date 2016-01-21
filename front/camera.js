module.exports = function (ENGINE) {

  let config = {
    FOV: 100,
    CUTOFF: 0.1,
    ASPECT_RATIO: window.innerWidth / window.innerHeight,
    TARGET_DISTANCE: 1000,
    INIT_POS: {
      x: 0,
      y: 2,
      z: 20
    }
  };

  let camera = new THREE.PerspectiveCamera(
    config.FOV, config.ASPECT_RATIO, config.CUTOFF, config.TARGET_DISTANCE
  );

  camera.position.set(config.INIT_POS.x, config.INIT_POS.y, config.INIT_POS.z);
  camera.lookAt({
    x: 0,
    y: 2,
    z: 20
  });

  return camera;
};
