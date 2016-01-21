module.exports = options => {

  options = _.defaults(options || {}, {
    color: 0xd3d3d3,
    width: 10,
    height: 10,
    position: {
      x: 0,
      y: 0,
      z: 0
    }
  });

  var plane         = new THREE.PlaneGeometry(options.width, options.height);
  var material      = new THREE.MeshBasicMaterial({ 
    color: options.color 
  });
  var floor         = new THREE.Mesh(plane, material);

  floor.rotation.x = (-Math.PI / 2);
  floor.position.set(options.position.x, options.position.y, options.position.z);

  return floor; 
};