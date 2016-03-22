const initialDistance = 5;
const angleShift      = (Math.PI / 180 * 36);
const xShift          = (Math.sin(angleShift) * initialDistance);
const zShift          = (Math.cos(angleShift) * -initialDistance);
// Serves to place and rotate the component instances into sectors
// of ?semi-dodecahedron (6 max for now?), may want to generate this later
export const componentArrangementMap = [
  // Initial front facing position
  { 
    position: new THREE.Vector3(0, 0, -initialDistance), 
    rotation: new THREE.Vector3(0, 0, 0) 
  },
  // Front left
  { 
    position: new THREE.Vector3(xShift, 0, zShift), 
    rotation: new THREE.Vector3(0, -angleShift, 0) 
  },
  // Front right
  { 
    position: new THREE.Vector3(-xShift, 0, zShift), 
    rotation: new THREE.Vector3(0, angleShift, 0) 
  }
];


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

  console.log('objectOne.name, objectTwo.name:', objectOne.name, objectTwo.name);

  objectOne.updateMatrixWorld();
  objectTwo.updateMatrixWorld();

  let relation       = {};
  
  let objectOnePos   = objectOne.position.clone();
  let objectTwoPos   = objectTwo.position.clone();

  let objectOneRot   = new THREE.Euler();
  let objectTwoRot   = new THREE.Euler();

  let oneQuaternion = new THREE.Quaternion();
  let twoQuaternion = new THREE.Quaternion();

  oneQuaternion.setFromRotationMatrix(objectOne.matrixWorld);
  twoQuaternion.setFromRotationMatrix(objectTwo.matrixWorld);

  objectOnePos.setFromMatrixPosition(objectOne.matrixWorld);
  objectTwoPos.setFromMatrixPosition(objectTwo.matrixWorld);

  objectOneRot.setFromQuaternion(oneQuaternion);
  objectTwoRot.setFromQuaternion(twoQuaternion);

  console.log(
    'getTransformRelation | objectOneRot, objectTwoRot, oneQuaternion, twoQuaternion:', 
    objectOneRot, objectTwoRot, oneQuaternion, twoQuaternion
  )

  let distanceVec = objectOnePos.sub(objectTwoPos);
  let rotationVec = objectOneRot.toVector3().sub(objectTwoRot.toVector3());

  // // new THREE.Vector3(
  // //   (objectOnePos.x - objectTwoPos.x),
  // //   (objectOnePos.y - objectTwoPos.y),
  // //   (objectOnePos.z - objectTwoPos.z)
  // // );
  // let rotationVec = new THREE.Vector3(
  //   (objectOneRot.x - objectTwoRot.x),
  //   (objectOneRot.y - objectTwoRot.y),
  //   (objectOneRot.z - objectTwoRot.z)
  // );

  relation.distanceVec = distanceVec;
  relation.rotationVec = rotationVec;
  relation.distance    = objectOnePos.distanceTo(objectTwoPos);
  relation.isClose     = (relation.distance < vicinity);

  return relation;
}
