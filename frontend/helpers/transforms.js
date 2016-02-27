/**
 * Rotate object around world axis.
 * @param  {THREE.object} object
 * @param  {'x' | 'y' | 'z'} axis
 * @param  {float} radians
 * @return {void}
 */
export function rotate(object, axis, radians) {

  //transform string axis type to vector3
  axis = (function(axis){
    switch(axis) {
      case 'x':
        return new THREE.Vector3(1, 0, 0);
      case 'y':
        return new THREE.Vector3(0, 1, 0);
      case 'z':
        return new THREE.Vector3(0, 0, 1);
    }
  })(axis);

  var rotMatrix = new THREE.Matrix4();
  rotMatrix.makeRotationAxis(axis.normalize(), radians);
  rotMatrix.multiply(object.matrix);
  object.matrix = rotMatrix;
  object.rotation.setFromRotationMatrix(object.matrix);
}

/**
 * Returns indices of object geometry faces that are facing the OCULARIS camera
 * @param  {THREE.Object} objectOne
 * @param  {THREE.Camera} camera
 * @return {??} indices
 */
export function getFacesToCamera(objectOne, camera) {
  var aligned = { value: null, faceIndices: [] };

  if (objectOne && objectOne.geometry && objectOne.geometry.faces) {
    var faces = objectOne.geometry.faces;
    var cameraLookAt = new THREE.Vector3(0,0, -1);
    var normalMatrix = new THREE.Matrix3().getNormalMatrix(objectOne.matrixWorld);

    cameraLookAt.applyQuaternion(camera.quaternion);
    faces.forEach(function(face, faceIndex) {
      var worldNormal =
        face.normal.clone().applyMatrix3(normalMatrix).normalize();
      var radiansToLookAt = worldNormal.angleTo(cameraLookAt);

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
 * Returns object containing information about the distance
 * between two objects and relative closeness boolean
 * based on provided vicinity argument
 * @param  {[type]} objectOne [description]
 * @param  {[type]} objectTwo [description]
 * @param  {[type]} vicinity  [description]
 * @return {[type]}           [description]
 */
export function getDistanceRelation(objectOne, objectTwo, vicinity) {
  var relation       = {};
  var objectOnePos   = objectOne.position;
  var objectTwoPos   = objectTwo.position;
  var distanceVec = new THREE.Vector3(
    (objectOnePos.x - objectTwoPos.x),
    (objectOnePos.y - objectTwoPos.y),
    (objectOnePos.z - objectTwoPos.z)
  );

  relation.distanceVec = distanceVec;
  relation.distance = objectOnePos.distanceTo(objectTwoPos);
  relation.isClose = (relation.distance < vicinity);

  return relation;
}
