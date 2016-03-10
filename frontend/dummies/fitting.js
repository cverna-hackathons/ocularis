/**
 * Return fitting plane properties
 * @param  {Object THREE.Plane} Frame that bounds the object viewable area
 * @param  {Object THREE.Camera} Scene camera object
 * @return {Object object: THREE.Plane, zDistance: Float} Plane that is scaled 
 *         to our component frame and zDistance that gives us distance from camera
 *         in which we can see the component fit into view
 * 
 */
export function Plane(frame, camera) {
  let cameraAspect  = camera.aspect;
  let frameParams   = frame.geometry.parameters;
  let cameraLookAt  = new THREE.Vector3(0, 0, -1);
  let frameAspect   = (frameParams.width / frameParams.height);
  let fovRad        = ((Math.PI / 180) * camera.fov);
  let hFovRad       = fovRad * cameraAspect;
  let cameraWider   = (cameraAspect > frameAspect);
  let frameWidth    = (
    cameraWider ? (frameParams.height * cameraAspect) : frameParams.width
  );
  let frameHeight = (
    cameraWider ? frameParams.height : (frameParams.width * cameraAspect)
  );
  let fittingPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(frameWidth, frameHeight),
    new THREE.MeshBasicMaterial({ color: '#00ff00', wireframe: true })
  );

  return {
    object: fittingPlane,
    zDistance: (frameWidth / (2 * Math.tan(hFovRad / 2)))
  };
}