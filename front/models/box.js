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
    material: new THREE.MeshLambertMaterial({color: 0xffffff})
  });

  return new THREE.Mesh(
    new THREE.BoxGeometry(opt.size.width, opt.size.height, opt.size.depth),
    opt.material
  );
}
