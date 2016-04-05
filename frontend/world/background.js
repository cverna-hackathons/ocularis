export default function (options, done) {

  options = options || { 
    bgPath: 'images/backdrop_desert.jpg',
    radius: 50,
    hCutOff: 0,
    vCutOff: 1,
    resolution: 20 
  };

  let texLoader   = new THREE.TextureLoader();
  let sphere      = new THREE.SphereGeometry(
    options.radius, options.resolution, options.resolution
    // , (Math.PI + options.hCutOff), (Math.PI - (2 * options.hCutOff)), options.vCutOff,
    //   (Math.PI - (2 * options.vCutOff))
  );
  let material    = new THREE.MeshBasicMaterial({
    side: THREE.BackSide
  });
  let backdrop    = new THREE.Mesh(sphere, material);  

  if (options.bgPath) {
    texLoader.load(options.bgPath, onTextureLoaded);
  } else if (options.color) {
    material.color = '#eeeeee';
    return done(backdrop);
  }
  
  /**
   * Once texture for background is loaded, assign it as mapping to the material
   * @param  {THREE.Texture} texture - Texture loaded
   * @return {Function execution} done - callback executed
   */
  function onTextureLoaded(texture) {
    console.log('onTextureLoaded | texture:', texture);
    material.map = texture;
    texture.needsUpdate = true;

    return done(backdrop);
  }

  
}