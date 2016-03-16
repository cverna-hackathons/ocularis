export default function (options, done) {

  let texLoader   = new THREE.TextureLoader();
  let sphere      = new THREE.SphereGeometry(200, 20, 20);
  

  options = options || { bgPath: 'images/backdrop_mountains.jpg' };
  texLoader.load(options.bgPath, onTextureLoaded);

  function onTextureLoaded(texture) {
    console.log('onTextureLoaded | texture:', texture);
    let material    = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide
    });
    texture.needsUpdate = true;
    return done(new THREE.Mesh(sphere, material));
  }
}