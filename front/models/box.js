module.exports = function(opt) {

  opt = _.defaults(opt || {}, {
    x: 0,
    y: 0,
    z: 0,
    size: {
      width: 1,
      height: 1,
      depth: 1
    },
    material: new THREE.MeshBasicMaterial({color: 'red'})
  });
  
  var geometry = new THREE.CubeGeometry(opt.size.width, opt.size.height, opt.size.depth);
  var box = new THREE.Mesh(geometry, opt.material);

  box.position.y = (opt.size.height / 2)

  return box;
}
