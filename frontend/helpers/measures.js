/**
 * Get rotation matrix that can be used to align a plane to face the camera
 * @param  {Object THREE.Plane} Frame that bounds the object viewable area
 * @param  {Object THREE.Camera} Scene camera object
 * @return {Object THREE.Matrix4} Rotation matrix btw camera look at vector 
 *                                and plane face normal
 * 
 */
export function planeToCameraRotation(plane, camera) {
  let normalMatrix    = new THREE.Matrix3().getNormalMatrix(plane.matrixWorld);
  let firstFace       = plane.geometry.faces[0];
  let worldNormal     = 
    firstFace.normal.clone().applyMatrix3(normalMatrix).normalize();
  let cameraLookAt    = new THREE.Vector3(0,0, -1);
  let radiansToLookAt = 
    worldNormal.angleTo(cameraLookAt.applyQuaternion(camera.quaternion));
  let rotationQ       = 
    new THREE.Quaternion().setFromUnitVectors(worldNormal, cameraLookAt);
  let rotationMatrix  = new THREE.Matrix4().makeRotationFromQuaternion(rotationQ);    

  console.log('planeToCameraRotation | plane, radiansToLookAt:', plane, radiansToLookAt)
  console.log('rotationMatrix, rotationQ:', rotationMatrix, rotationQ)

  return rotationMatrix;
}


/**
 * Get the standard camera vector looking down the z axis
 * @return {THREE.Vector3} Camera initial lookat vector
 */
export function cameraLookAt() {
  return new THREE.Vector3(0, 0, -1);
}


/**
 * Returns object containing information about the distance
 * between two objects, relative closeness boolean, and rotation delta
 * based on provided vicinity argument
 * @param  {[type]} objectOne [THREE.js object]
 * @param  {[type]} objectTwo [THREE.js object]
 * @param  {[type]} vicinity  [Defines in distance what is considered near]
 * @return {Object}           Returns object with info about distance, rotation between 
                              the objects
 */
export function getTransformRelation(objectOne, objectTwo, vicinity) {
  
  let relation       = {};
  
  let objectOnePos   = objectOne.position;
  let objectTwoPos   = objectTwo.position;

  let objectOneRot   = objectOne.rotation;
  let objectTwoRot   = objectTwo.rotation;

  let distanceVec = new THREE.Vector3(
    (objectOnePos.x - objectTwoPos.x),
    (objectOnePos.y - objectTwoPos.y),
    (objectOnePos.z - objectTwoPos.z)
  );
  let rotationVec = new THREE.Vector3(
    (objectOneRot.x - objectTwoRot.x),
    (objectOneRot.y - objectTwoRot.y),
    (objectOneRot.z - objectTwoRot.z)
  );

  relation.distanceVec = distanceVec;
  relation.rotationVec = rotationVec;
  relation.distance    = objectOnePos.distanceTo(objectTwoPos);
  relation.isClose     = (relation.distance < vicinity);

  return relation;
}
