OCULARIS.component.cube = function(options) {
  var ENGINE          = OCULARIS.engine;
  var relation       = {
    toCamera: {}
  };
  var componentModel  = options.componentModel;
  var options         = _.defaults(options || {}, {
    vicinity: 25,
    size: {
      width: 4,
      height: 4,
      depth: 4
    },
    position: {
      x: 0,
      y: 0,
      z: 5
    },
    text: {
      font: "bold 10px Arial",
      color: "black"
    },
    colors: {
      default: 0xbbbbbb,
      close: 0xffffff,
      active: 0xffcc00
    },

    resolution: {
      x: 1024,
      y: 1024
    }
  });

  var geometry = new THREE.BoxGeometry(
    options.size.width, options.size.height, options.size.depth
  );
  var material = new THREE.MeshBasicMaterial({
    color: options.colors.default, vertexColors: THREE.FaceColors
  });
  var cube = new THREE.Mesh(geometry, material);

  function place() {
    OCULARIS.engine.scene.add(cube);
    cube.position.x = options.position.x;
    cube.position.y = options.position.y;
    cube.position.z = options.position.z;
  }

  function setCameraRelation() {
    relation.toCamera.faceIndices = OCULARIS.engine.getFacesToCamera(cube);
    _.extend(
      relation.toCamera,
      OCULARIS.engine.getDistanceRelation(cube, ENGINE.camera, options.vicinity)
    );
  }

  function setOwnConditionals() {
    var oldColor = cube.material.color.getHex();
    if (relation.toCamera.isClose) {
      cube.material.color.setHex(options.colors.close);
      colorFacingSurface();
    }
    else {
      cube.material.color.setHex(options.colors.default);
    }
    if (cube.material.color.getHex() !== oldColor)
      return true;
    else
      return false;
  }

  function colorFacingSurface() {
    var faceIndices = relation.toCamera.faceIndices || [];
    var change = false;
    var oldColor;

    if (faceIndices.length) {
      geometry.faces.forEach(function(face, faceIndex) {
        oldColor = face.color.getHex();
        newColor = options.colors[(faceIndices.indexOf(faceIndex) > -1 ? 'active' : 'close')]
        if (oldColor !== newColor) {
          face.color.setHex(newColor);
          change = true;
        }
      });
      if (change) {
        console.log('colorFacingSurface cube, faceIndices:', cube, faceIndices);
        geometry.colorsNeedUpdate = true;
      }
    }

    return change;
  }

  function check() {
    var change = false;
    if (setCameraRelation()) change = true;
    if (setOwnConditionals()) change = true;

    return change;
  }

  function rotate(direction) {
    var angle = Math.PI / 2;
    switch(direction) {
      case 'up':
        rotateAnimation(-angle, 'x', 3);
        break;
      case 'down':
        rotateAnimation(angle, 'x', 3);
        break;
      case 'right':
        rotateAnimation(angle, 'y', 3);
        break;
      case 'left':
        rotateAnimation(-angle, 'y', 3);
        break;
    }

    check();
    OCULARIS.engine.frameUpdate = true;
  }

  function rotateAnimation(angle, axis, durationInSecs) {
    var actualAngle = 0,
        angleIncrement = angle / (durationInSecs * (1000 / 60));
    var animationInterval = setInterval(function(){
      if (Math.abs(actualAngle) > Math.abs(angle))
        clearInterval(animationInterval);
      else {
        actualAngle += angleIncrement;
        switch(axis) {
          case 'x':
            cube.rotateX(angleIncrement);
            break;
          case 'y':
            cube.rotateY(angleIncrement);
            break;
        }
      }
      OCULARIS.engine.frameUpdate = true;
    }, 1000 / 60);
  }

  return {
    object: cube,
    place: place,
    check: check,
    relation: relation,
    rotate: rotate
  };
}
