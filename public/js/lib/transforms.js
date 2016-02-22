OCULARIS.Transforms = {

  /**
   * Rotate object around world axis.
   * @param  {THREE.object} object
   * @param  {'x' | 'y' | 'z'} axis
   * @param  {float} radians
   * @return {void}
   */
  rotate: function(object, axis, radians) {

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

};
