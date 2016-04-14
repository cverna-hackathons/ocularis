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

/** Returns distance between two objects
 * @param  {[type]} objectOne [THREE.js object]
 * @param  {[type]} objectTwo [THREE.js object]
 * @return {Float} distance - between the two provided objects
 */
export function distanceBetween(objectOne, objectTwo) {
  return objectOne.position.distanceTo(objectTwo.position);
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
export function getTransformRelation(objectOne, objectTwo) {

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

  let distanceVec = objectOnePos.sub(objectTwoPos);
  let rotationVec = objectOneRot.toVector3().sub(objectTwoRot.toVector3());

  relation.distanceVec = distanceVec;
  relation.rotationVec = rotationVec;
  relation.distance    = objectOnePos.distanceTo(objectTwoPos);

  return relation;
}
