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
 * Returns indices of object geometry faces that are facing the OCULARIS camera
 * @param  {THREE.Object} objectOne
 * @param  {THREE.Camera} camera
 * @return {Object} Value for angle to camera, 
                    and faceIndices for indexes of faces facing the camera
 */
export function getFacesToCamera(objectOne, camera) {
  let aligned = { value: null, faceIndices: [] };

  if (objectOne && objectOne.geometry && objectOne.geometry.faces) {
    let faces = objectOne.geometry.faces;
    let cameraLookAt = new THREE.Vector3(0, 0, -1);
    let normalMatrix = new THREE.Matrix3().getNormalMatrix(objectOne.matrixWorld);

    cameraLookAt.applyQuaternion(camera.quaternion);
    faces.forEach((face, faceIndex) => {
      let worldNormal =
        face.normal.clone().applyMatrix3(normalMatrix).normalize();
      let radiansToLookAt = worldNormal.angleTo(cameraLookAt);

      if (aligned.value === radiansToLookAt) {
        aligned.faceIndices.push(faceIndex);
      }
      else if (aligned.value === null || radiansToLookAt > aligned.value) {
        aligned.value = radiansToLookAt;
        aligned.faceIndices = [faceIndex];
      }
    });
  }
  return aligned.faceIndices;
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