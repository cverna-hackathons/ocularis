/**
 * Return proportional properties
 * @param  {Object THREE.Plane} Frame that bounds the object viewable area
 * @param  {Object THREE.Camera} Scene camera object
 * @return {Float} Distance from camera, to fit the frame in view
 * 
 */
export function distanceToCameraFit(frame, camera) {

  let cameraAspect = camera.aspect;
  let frameParams = frame.geometry.parameters;
  let frameAspect = (frameParams.width / frameParams.height);
  let fovRad = ((Math.PI / 180) * camera.fov);
  let hFovRad = fovRad * cameraAspect;
  let cameraWider = (cameraAspect > frameAspect);
  let frameWidth = (
    cameraWider ? (frameParams.height * cameraAspect) : frameParams.width
  );
  // let frameHeight = (
  //   cameraWider ? frameParams.height : (frameParams.width * cameraAspect)
  // );
  // let cameraFrame = new THREE.Mesh(
  //   new THREE.PlaneGeometry(frameWidth, frameHeight),
  //   new THREE.MeshBasicMaterial({ color: '#00ff00', wireframe: true })
  // );
  let zDistance = (frameWidth / (2 * Math.tan(hFovRad / 2)));

  return zDistance;

  
}