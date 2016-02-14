OCULARIS.component.cube = function(options) {
  var ENGINE          = OCULARIS.engine;
  var relation       = {
    toCamera: {}
  };
  var componentModel  = options.componentModel;
  var options         = _.defaults(options || {}, {
    vicinity: 25,
    size: {
      width: 12,
      height: 12,
      depth: 12
    },
    position: {
      x: 0,
      y: 0,
      z: 0
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
  var cubeMaterials = buildMaterials();
  var materialProperties = {
    indexOfFacing: null,
    facingLoaded: false
  }; 

  // new THREE.MeshBasicMaterial({
  //   color: options.colors.default, vertexColors: THREE.FaceColors
  // });
  var cube = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(cubeMaterials));

  function buildMaterials() {
    var materials = [];

    for (var materialIdx = 0; materialIdx < 6; materialIdx++) {
      materials.push(new THREE.MeshBasicMaterial({
        color: options.colors.default,
        map: applyTexture('init!', 512)
      }));
    }
    return materials;
  }

  function place() {
    OCULARIS.engine.scene.add(cube);
    cube.position.x = options.position.x;
    cube.position.y = options.position.y;
    cube.position.z = options.position.z;
    console.log('cube', cube);
  }

  function setCameraRelation() {
    relation.toCamera.faceIndices = OCULARIS.engine.getFacesToCamera(cube);
    _.extend(
      relation.toCamera,
      OCULARIS.engine.getDistanceRelation(cube, ENGINE.camera, options.vicinity)
    );
  }

  function setOwnConditionals() {
    // var oldColor = cube.material.color.getHex();
    if (relation.toCamera.isClose) {
      return applyFacingMaterials();
    }
    else {
      return checkDefaultMaterials();
    }
  }

  function checkDefaultMaterials() {
    return false;
  }

  function checkSizeOnScreen() {

    // My FOV in radians (comes from default 90 degrees in camera.js, may want to parametrize this)
    var camera = OCULARIS.engine.camera;
    var FOVrad =  (camera.fov * Math.PI / 180);
    var distance = (
      camera.position.z - cube.position.z - (options.size.height / 2)
    );

    return parseInt(
      options.size.height / (
        2 * Math.tan(FOVrad / 2) * distance
      ) * window.innerHeight
    );
  }

  // Add texture here to return for material
  function applyTexture(text, size) {
    return createtexture(text, 20, 50, size);
  }

  function createtexture(text, x, y, size) {
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var texture = new THREE.Texture(canvas);

    canvas.width = size;
    canvas.height = size;

    // if x isnt provided
    if( x === undefined || x === null ){
      var textSize  = context.measureText(text);
      x = (canvas.width - textSize.width) / 2;
    }
    // actually draw the text
    context.fillStyle = 'white';
    context.font  = "bold 50px Arial"
    context.fillText(text, x, y);
    // make the texture as .needsUpdate
    texture.needsUpdate  = true;
    // for chained API
    return texture;
  };

  function applyFacingMaterials() {
    var faceIndices = relation.toCamera.faceIndices || [];
    var change = false;
    var facingCamera;

    if (faceIndices.length) {
      var oldColor, newColor;
      var faceIndex = faceIndices[0];
      var facingMaterialIdx = cube.geometry.faces[faceIndex].materialIndex;

      if (facingMaterialIdx !== materialProperties.indexOfFacing) {
        materialProperties.facingLoaded = false;
      }
      if (facingMaterialIdx >= 0) {
        cubeMaterials.forEach(function(material, materialIdx) {
          oldColor = material.color.getHex();
          facingCamera = (materialIdx === facingMaterialIdx);
          newColor = options.colors[(facingCamera ? 'active' : 'close')];
          
          if (
            !materialProperties.facingLoaded && facingCamera && 
            materialProperties.indexOfFacing !== materialIdx
          ) {
            material.color.setHex(newColor);
            console.log('checkSizeOnScreen', checkSizeOnScreen());
            material.map = applyTexture('active!', 512);
            materialProperties.indexOfFacing = facingMaterialIdx;
            materialProperties.facingLoaded = true;
            change = true;
          }
        });
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

  var animationInterval;
  function rotateAnimation(angle, axis, durationInSecs) {
    var actualAngle = 0,
        angleIncrement = angle / (durationInSecs * (1000 / 60));
    if (animationInterval) {
      //previous animation not finished -> throw away this animation
      return;
    }
    animationInterval = setInterval(function(){
      if (Math.abs(actualAngle) > Math.abs(angle)) {
        clearInterval(animationInterval);
        animationInterval = null;
      }
      else {
        actualAngle += angleIncrement;
        switch(axis) {
          case 'x':
            Transforms.rotate(cube, 'x', angleIncrement);
            break;
          case 'y':
            Transforms.rotate(cube, 'y', angleIncrement);
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
