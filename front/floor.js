module.exports = ENGINE => {

  var plane         = new THREE.PlaneGeometry(10, 10);
  var material      = new THREE.MeshBasicMaterial({ 
    color: ENGINE.floor_color || 'green' 
  });
  var floor         = new THREE.Mesh(plane, material);

  floor.rotation.x = -Math.PI / 2;
  return floor; 
};