/**
 * Rotate object around world axis.
 * @param  {THREE.object} object
 * @param  {'x' | 'y' | 'z'} axis
 * @param  {float} radians
 * @return {void}
 */
export function rotate(object, axis, radians) {

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

  let rotMatrix = new THREE.Matrix4();
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

export function moveTo(object, distanceVec) {
  object.position.add(distanceVec);
}

export function rotateTo(object, rotationVec) {
  object.rotation.copy(rotationVec);
}
