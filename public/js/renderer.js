OCULARIS.renderer = function () {

  var renderer = new THREE.WebGLRenderer({
  	// alpha: true,
  	// antialias : true
  });
  renderer.setPixelRatio(window.devicePixelRatio);

  return renderer;
};
