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