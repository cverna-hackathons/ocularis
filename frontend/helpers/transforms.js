/**
 * Rotate object around world axis.
 * @param  {THREE.object} object
 * @param  {'x' | 'y' | 'z'} axis
 * @param  {float} radians
 * @return {void}
 */
export function rotate(object, axis, radians) {

  let rotMatrix = new THREE.Matrix4();
  //transform string axis type to vector3
  axis = ((axis) => {
    switch(axis) {
      case 'x':
        return new THREE.Vector3(1, 0, 0);
      case 'y':
        return new THREE.Vector3(0, 1, 0);
      case 'z':
        return new THREE.Vector3(0, 0, 1);
    }
  })(axis);

  rotMatrix.makeRotationAxis(axis.normalize(), radians);
  rotMatrix.multiply(object.matrix);
  object.matrix = rotMatrix;
  object.rotation.setFromRotationMatrix(object.matrix);
}

/**
 * Moves (NO animation) object to a distance vector (by adding the position and distance vectors)
 * @param  {THREE.Object} object that is to be moved
 * @param  {THREE.Vector3} Distance vector
 * @return {void} 
 */
export function moveBy(object, distanceVec) {
  object.position.add(distanceVec);
}

/**
 * Rotates (NO animation) object to given rotation vector
 * @param  {THREE.Object} object that is to be moved
 * @param  {THREE.Vector3} Rotation vector
 * @return {void} 
 */
export function rotateBy(object, rotationVec) {
  let rot = object.rotation.toVector3();
  rot.addVectors(rot, rotationVec);
  object.rotation.setFromVector3(rot);
}