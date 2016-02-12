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
    relation.toCamera.facesTo = OCULARIS.engine.getFacesToCamera(cube);
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
    var facesTo = relation.toCamera.facesTo || [];
    var change = false;
    var oldColor; 

    if (facesTo.length) {
      facesTo.forEach(function(face) {
        oldColor = face.color.getHex();
        if (oldColor !== options.colors.active) {
          face.color.setHex(options.colors.active);
          change = true;
        }
      });
      if (change) {
        console.log('colorFacingSurface cube:', cube);
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

  return {
    object: cube,
    place: place,
    check: check,
    relation: relation
  };
}
