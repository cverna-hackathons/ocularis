OCULARIS.component.cube = function(options) {
  var ENGINE          = OCULARIS.engine;
  var mapSizes        = [8, 9, 10].map(function(powerTo) {
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
      width: 1,
      height: 1,
      depth: 1
    },
    position: {
      x: -1,
      y: -1,
      z: -2.5
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
  var rotationMap = {
    forward: [-1, 'x', 0],
    backward: [1, 'x', 0],
    right: [1, 'y', 0],
    left: [-1, 'y', 0],
    revolutions: {
      x: 0,
      y: 0,
      z: 0
    },
    placement: {
      right: 0,
      left: 1,
      top: 2,
      bottom: 3,
      front: 4,
      back: 5
    },
    angles: [0, 0, 0, 0, 0, 0],
    initial: ['right', 'left', 'top', 'bottom', 'front', 'back']
  };
  var cubeMaterials = buildMaterials();
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
      var side;
      var material = new THREE.MeshLambertMaterial({
        color: options.colors.default,
        map: buildTextureFromText('To load!', 512)
      });
      materials.push(material);

      switch (materialIdx) {
        case 0:
          side = 'right';
          break;
        case 1:
          side = 'left';
          break;
        case 2:
          side = 'top';
          break;
        case 3:
          side = 'bottom';
          break;
        case 4:
          side = 'front';
          break;
        case 5:
          side = 'back';
          break;
      }
      rotationMap.placement[side] = materialIdx;
      materialProperties.unloadedIdxs.push(materialIdx);
    }
    return materials;
  }

  function rotateTextures(rotationAxis, angleMultiplier) {
    var along;
    var across;
    var prevPlacement = _.clone(rotationMap.placement);

    switch (rotationAxis) {
      case 'x':
        along = ['back', 'top', 'front', 'bottom'];
        across = ['right', 'left'];
        break;
      case 'y':
        along = ['front', 'right', 'back', 'left'];
        across = ['top', 'bottom'];
        break;
      case 'z':
        along = ['top', 'right', 'bottom', 'left'];
        across = ['front', 'back'];
        break;
    }

    var newAlong = along.slice(0);
    var mover = newAlong[angleMultiplier > 0 ? 'shift' : 'pop']();

    newAlong[angleMultiplier > 0 ? 'push' : 'unshift'](mover);
    rotationMap.revolutions[rotationAxis] += angleMultiplier;

    newAlong.forEach(function(newSide, sideIdx) {
      var materialSideToMove = along[sideIdx];
      var materialIdx = prevPlacement[materialSideToMove];
      var initialSide = rotationMap[materialIdx];

      console.log('materialSideToMove, materialIdx, newSide:', materialSideToMove, materialIdx, newSide);
      rotationMap.placement[newSide] = materialIdx;
    });


    across.forEach(function(side, tempIdx) {
      var angle = -(Math.PI / 2 * Math.pow(angleMultiplier, tempIdx));
      var materialIdx = rotationMap.placement[side];

      rotationMap.angles[materialIdx] += angle;
      rotateTexture(side, angle, materialIdx);
    });

    console.log('rotateTextures | rotationAxis, angleMultiplier, newAlong, rotationMap:',
      rotationAxis, angleMultiplier, newAlong, rotationMap, across);


  }

  function rotateTexture(side, angle, idx) {
    var materialIdx = rotationMap.placement[side];
    var material    = cubeMaterials[materialIdx];

    if (material && material.map && material.map.image) {
      var canvas = material.map.image;
      var ctx = canvas.getContext('2d');

      if (ctx && angle !== 0) {
        console.log('rotateTexture | side, angle, ctx:', side, angle, ctx);

        console.log('ctx.currentTransform', ctx.currentTransform)
        var tempCanvas = document.createElement('canvas');
        var tempCtx = tempCanvas.getContext('2d');
        var size = canvas.width;
        
        tempCanvas.width = size;
        tempCanvas.height = size;
        tempCtx.drawImage(canvas, 0, 0, size, size);

        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.rotate(angle);
        ctx.translate(-size / 2, -size / 2);
        ctx.drawImage(tempCanvas, 0, 0, size, size);
        ctx.restore();
        material.map.needsUpdate  = true;
      }
    }

    cube.geometry.faceVertexUvs[0] = [];

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

  function applyFacingMaterials() {
    var faceIndices = relation.toCamera.faceIndices || [];
    var change = false;
    var facingCamera;

    if (faceIndices.length) {
      var oldColor, newColor, unloadedMaterial;
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
            materialProperties.indexOfFacing !== materialIdx &&
            componentModel.nextElement
          ) {
            console.log('facing')
            material.color.setHex(newColor);
            material.map = buildTextureFromText(
              (
                'active! (idx: ' + materialIdx + ') - ' +
                componentModel.nextElement.text
              ), getMapSizeCloseTo(checkSizeOnScreen())
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
            console.log('unloaded')
            material.color.setHex(newColor);
            material.map = buildTextureFromText(
              'Unloaded stuff! (idx: ' + materialIdx + ')', 
              getMapSizeCloseTo(checkSizeOnScreen())
            );
            materialProperties.addToUnloaded(materialIdx);
            change = true;
          }
        });
      }
    }

    return change;
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
    var background  = (options.background || "#ffffff");


    ctx.canvas.width  = options.maxWidth;
    ctx.canvas.height = ctx.canvas.width;

    do {
      // Calculate canvas size, add margin

      adjustToFontSize();
      fontSize--;
    } while (fontSize > 0 && projectedHeight > options.maxWidth);


    // removed fontSize + (( fontSize + 5 ) * lines.length)
    // since we are in a cube, we use the same height and width
    ctx.font   = fontSize + "px Arial";

    // Render
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
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
        for(i=textCopy.length; (ctx.measureText(textCopy.substr(0, i)).width + lineSpacing) > maxWidth; i--);
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

  function updateRotationTracking(started, direction) {

    relation.toSpace.rotation.inProgress = started;
    relation.toSpace.rotation.direction = direction;

    if (started) {
      var rotationOptions = rotationMap[direction];
      var angleMultiplier = rotationOptions[0];
      var rotationAxis    = rotationOptions[1];
      console.log('updateRotationTracking | started, direction:', started, direction)
      rotateTextures(rotationAxis, angleMultiplier);
    }
  }

  

  // Triggers rotation based on direction provided and passes the done callback
  function rotate(direction) {
    var angle = Math.PI / 2;
    var rotationDuration = 2;
    var rotationOptions = rotationMap[direction];
    var relativeAngle = (rotationOptions[0] * angle);

    if (rotationOptions) {
      rotateAnimation(
        relativeAngle, rotationOptions[1], rotationDuration,
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
          console.log(cube);
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
    animationInterval = setInterval(function (){

      actualAngle += angleIncrement;
      var diff = Math.abs(actualAngle) - Math.abs(angle);
      var ending = false;
      if (diff > 0) {
        ending = true;
        angleIncrement += (angle < 0) ? diff : -diff;
      }

      switch(axis) {
        case 'x':
          Transforms.rotate(cube, 'x', angleIncrement);
          break;
        case 'y':
          Transforms.rotate(cube, 'y', angleIncrement);
          break;
      }

      if (ending) {
        clearInterval(animationInterval);
        animationInterval = null;
        if (stopped) return stopped(true);
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
