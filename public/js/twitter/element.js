OCULARIS.twitter.element = function(position, tweet) {

  return OCULARIS.models.box({
    x: position.x,
    y: position.y,
    z: position.z,
    size: {
      width: 4,
      height: 8,
      depth: 0.2
    },
    material: new THREE.MeshBasicMaterial({ color: 0xeeeeee })
  });
}
