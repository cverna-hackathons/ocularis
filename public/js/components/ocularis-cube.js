OCULARIS.component.cube = function(options) {
  var ENGINE          = OCULARIS.engine;
  var mapSizes        = [8, 9, 10, 11].map(function(powerTo) { 
    return Math.pow(2, powerTo);
  });
  var relation       = {
    toCamera: {},
    toSpace: {
      rotation: {
        inProgress: false,
        direction: null
      }
    }
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
  var rotationMap = {
    forward: [-1, 'x'],
    backward: [1, 'x'],
    right: [1, 'y'],
    left: [-1, 'y']
  }
  var geometry = new THREE.BoxGeometry(
    options.size.width, options.size.height, options.size.depth
  );
  var materialProperties = {
    indexOfFacing: null,
    facingLoaded: false,
    unloadedIdxs: [],
    unloadedIdxPos: function(materialIdx) {
      return materialProperties.unloadedIdxs.indexOf(materialIdx);
    },
    removeFromUnloaded: function(materialIdx) {
      var position = materialProperties.unloadedIdxPos(materialIdx);
      if (position > -1) materialProperties.unloadedIdxs.splice(position, 1);
    },
    addToUnloaded: function(materialIdx) {
      var position = materialProperties.unloadedIdxPos(materialIdx);
      if (position === -1) materialProperties.unloadedIdxs.push(materialIdx);
    }
  };
  var cubeMaterials = buildMaterials();

  // new THREE.MeshBasicMaterial({
  //   color: options.colors.default, vertexColors: THREE.FaceColors
  // });
  var cube = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(cubeMaterials));

  function getMapSizeCloseTo(size) {
    var result;

    for (var i = 0; i < mapSizes.length; i++) {
      result = mapSizes[i];

      if (result > size) {
        break;
      }
    }
    return result;
  }

  function buildMaterials() {
    var materials = [];

    for (var materialIdx = 0; materialIdx < 6; materialIdx++) {
      materials.push(new THREE.MeshBasicMaterial({
        color: options.colors.default,
        map: buildTextureFromText('To load!', 1024)
      }));
      materialProperties.unloadedIdxs.push(materialIdx);
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
  function buildTextureFromText(text, size) {
    console.log('buildTextureFromText | size:', size);
    var texture = new THREE.Texture(getCanvasWithTextWrap(text, { 
      maxWidth: size 
    }));
    texture.needsUpdate  = true;
    return texture;
  }

  function applyFacingMaterials() {
    var faceIndices = relation.toCamera.faceIndices || [];
    var change = false;
    var facingCamera;

    if (faceIndices.length) {
      var oldColor, newColor, unloadedMaterial, mapSize;
      var faceIndex = faceIndices[0];
      var facingMaterialIdx = cube.geometry.faces[faceIndex].materialIndex;

      if (facingMaterialIdx !== materialProperties.indexOfFacing) {
        materialProperties.facingLoaded = false;
      }
      if (facingMaterialIdx >= 0) {
        cubeMaterials.forEach(function(material, materialIdx) {
          oldColor = material.color.getHex();
          mapSize = getMapSizeCloseTo(checkSizeOnScreen());
          facingCamera = (materialIdx === facingMaterialIdx);
          newColor = options.colors[(facingCamera ? 'active' : 'close')];
          
          if (
            !materialProperties.facingLoaded && facingCamera &&
            materialProperties.indexOfFacing !== materialIdx &&
            componentModel.nextElement
          ) {
            material.color.setHex(newColor);
            material.map = buildTextureFromText(
              (
                'active! (idx: ' + materialIdx + ') - ' + 
                componentModel.nextElement.text
              ), mapSize
            );
            materialProperties.indexOfFacing = facingMaterialIdx;
            materialProperties.facingLoaded = true;
            materialProperties.removeFromUnloaded(materialIdx);
            change = true;
          }
          else if (
            materialProperties.facingLoaded && !facingCamera &&
            materialProperties.unloadedIdxPos(materialIdx) === -1
          ) {
            material.map = buildTextureFromText(
              'Unloaded stuff! (idx: ' + materialIdx + ')', mapSize
            );
            materialProperties.addToUnloaded(materialIdx);
            change = true;
          }
        });
      }
    }

    return change;
  }

  function nextElementText() {
    return ;
  }
 
  function getCanvasWithTextWrap(text, options) {
    console.log('getCanvasWithTextWrap | options:', options);
    var i, j, lines, lineSpacing;
    var canvas  = document.createElement('canvas');
    var ctx     = canvas.getContext('2d');
    var width   = 0; 
    var fontSize    = (options.fontSize || 50);
    var fontFace    = (options.fontFace || 'Arial');
    var maxWidth    = (options.maxWidth || 250);
    var fontColor   = (options.fontColor || "#000000");
    
    do {
      adjustToFontSize();
      fontSize--;
    } while (fontSize > 0 && projectedHeight > options.maxWidth);

    // Calculate canvas size, add margin
    ctx.canvas.width  = lineSpacing + width;

    // removed fontSize + (( fontSize + 5 ) * lines.length)
    // since we are in a cube, we use the same height and width
    ctx.canvas.height = ctx.canvas.width;
    ctx.font   = fontSize + "px Arial";

    // Render
    ctx.fillStyle = fontColor;
    j = lines.length;

    for (i=0; i < j; i++) {
      ctx.fillText(
        lines[i], lineSpacing, ((fontSize + lineSpacing) * (i + 1))
      );
    }

    return canvas;

    function adjustToFontSize() {
      var textCopy = '' + text;
      var result;
      
      lineSpacing = parseInt(fontSize / 2);
      projectedHeight = lineSpacing;
      lines = new Array();
      // Measure text and calculate width
      // Font and size is required for ctx.measureText()
      ctx.font   = (fontSize + 'px ' + fontFace);

      while (textCopy.length) {
        for(i=textCopy.length; ctx.measureText(textCopy.substr(0, i)).width > maxWidth; i--);
      
        result = textCopy.substr(0,i);
      
        if (i !== textCopy.length)
          for( j=0; result.indexOf(" ",j) !== -1; j=result.indexOf(" ",j)+1 );
        
        lines.push(result.substr(0, j || result.length));
        width = Math.max(width, ctx.measureText(lines[ lines.length-1 ]).width);
        textCopy = textCopy.substr(lines[ lines.length-1 ].length, textCopy.length);
        projectedHeight += (fontSize + lineSpacing);
      }
    }
  }

  // Checks the state of changes in component
  // 1. If the camera has changed
  // 2. If other conditions have changed (facing camera, material updates, loads)
  function check() {
    var change = false;
    if (setCameraRelation()) change = true;
    if (setOwnConditionals()) change = true;

    return change;
  }

  function updateRotationTracking(inProgress, direction) {
    relation.toSpace.rotation.inProgress = inProgress;
    relation.toSpace.rotation.direction = direction;
  }

  // Triggers rotation based on direction provided and passes the done callback
  function rotate(direction) {
    var angle = Math.PI / 2;
    var rotationDuration = 2;
    var rotationOptions = rotationMap[direction];
    
    if (rotationOptions) {
      rotateAnimation(
        (rotationOptions[0] * angle), rotationOptions[1], rotationDuration, 
      function(started) {
        if (started) {
          updateRotationTracking(started, direction);
          if (componentModel.eventStart) componentModel.eventStart({
            type: 'shift',
            direction: direction
          });
        }
      },
      function(stopped) {
        if (stopped) {
          updateRotationTracking(!stopped, null);
          if (componentModel.eventStop) componentModel.eventStop({
            type: 'shift',
            direction: direction
          });
        }
      });
      check();
      OCULARIS.engine.frameUpdate = true;
    }
  }

  // Schedules a rotation interval which executes it 
  // until the desired angle has been reached
  // We leave animation interval outside the scope for later possible export
  var animationInterval;
  function rotateAnimation(angle, axis, durationInSecs, started, stopped) {
    var actualAngle = 0;
    var angleIncrement = angle / (durationInSecs * (1000 / 60));

    if (animationInterval) {
      //previous animation not finished -> throw away this animation
      if (started) started(false);
      return;
    }
    console.log('animationInterval started');
    animationInterval = setInterval(function(){
      if (Math.abs(actualAngle) >= Math.abs(angle)) {
        clearInterval(animationInterval);
        animationInterval = null;
        if (stopped) return stopped(true);
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
    if (started) started(true);
  }

  return {
    object: cube,
    place: place,
    check: check,
    relation: relation,
    rotate: rotate
  };
}
