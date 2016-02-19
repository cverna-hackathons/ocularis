OCULARIS.camera = function () {

  var config = {
    FOV: 75,
    CUTOFF: 0.1,
    ASPECT_RATIO: window.innerWidth / window.innerHeight,
    TARGET_DISTANCE: 10000
  };

  var camera = new THREE.PerspectiveCamera(
    config.FOV, config.ASPECT_RATIO, config.CUTOFF, config.TARGET_DISTANCE
  );

  return camera;
};
