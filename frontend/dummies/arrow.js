export default function(camera) {
  return new THREE.ArrowHelper(
    camera.getWorldDirection(), 
    camera.getWorldPosition(), 1, 0x00ff00
  );
}
