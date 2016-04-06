export default function (options, engine, done) {

  options = options || { 
    bgPath: 'images/backdrop_desert.jpg',
    radius: 50,
    hCutOff: 0,
    vCutOff: 1,
    resolution: 20 
  };

  if (options.bgPath) {
    loadEquirectangularTexture(done);
  } else if (options.color) {
    engine.getRenderer().setClearColor(options.color, 1);
    return done();
  }
  
  /**
   * Once texture for background is loaded, assign it as mapping to the material
   * @param  {THREE.Texture} texture - Texture loaded
   * @return {Function execution} done - callback executed
   */

  function loadEquirectangularTexture(next) {
    let texLoader   = new THREE.TextureLoader();
    let sphere      = new THREE.SphereGeometry(
      options.radius, options.resolution, options.resolution
    );
    let material    = new THREE.MeshBasicMaterial({ side: THREE.BackSide });
    let backdrop    = new THREE.Mesh(sphere, material); 

    texLoader.load(options.bgPath, (texture) => {
      material.map = texture;
      texture.needsUpdate = true;
      return next(backdrop);
    });    
  }
  
}