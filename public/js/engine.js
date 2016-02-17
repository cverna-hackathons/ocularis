OCULARIS.createEngine = function () {
  var ENGINE = {
    models: [],

    // Initializes instances of scene essentials, renderer, view and events
    // Loads provided [optional] content structure
    init: function () {
      var redBox   = OCULARIS.component.pointer();

      ENGINE.VREnabled= true;
      ENGINE.light    = OCULARIS.light();
      ENGINE.scene    = OCULARIS.scene();
      ENGINE.renderer = OCULARIS.renderer();
      ENGINE.motion   = OCULARIS.motion();
      ENGINE.draw     = OCULARIS.draw();
      ENGINE.view     = OCULARIS.view();
      ENGINE.events   = OCULARIS.events();

      OCULARIS.config.loadContentStructure(function() {
        ENGINE.availableContent.models.forEach(initializeModel)
      });

      ENGINE.scene.add(redBox);
      ENGINE.scene.add(ENGINE.light);

      // ENGINE.events.addEventListener('enter', ENGINE.switchVR);
      // ENGINE.events.addEventListener('z', ENGINE.resetVRSensor);

      return ENGINE;
    },
    switchVR: function () {
      ENGINE.VREnabled = !ENGINE.VREnabled;
      ENGINE.view.reset();
      console.log('switching VR:', ENGINE.VREnabled);
    },
    enableVR: function () {
      ENGINE.VRControls = new THREE.VRControls(ENGINE.camera);
      ENGINE.VREffect   = new THREE.VREffect(ENGINE.renderer);
      ENGINE.VREffect.setSize(window.innerWidth, window.innerHeight);
      ENGINE.VRManager = new WebVRManager(ENGINE.renderer, ENGINE.VREffect, {
        hideButton: false,
        isUndistorted: false
      });
      // ENGINE.resetVRSensor();
    },
    resetVRSensor: function () {
      if (ENGINE.VREnabled) {
        ENGINE.VRControls.resetSensor();
      }
    },
    disableVR: function () {
      ENGINE.VRControls = null;
      ENGINE.VREffect   = null;
      ENGINE.renderer.setSize(window.innerWidth, window.innerHeight);
    },
    update: update,
    getDistanceRelation: getDistanceRelation,
    getFacesToCamera: getFacesToCamera
  };

  // Loops through all active models plugged in via configuration
  // Checks the models for update
  // Sets frameUpdate to true if so
  function update() {
    ENGINE.models.forEach(function(model) {
      if (model.active && model.checkUpdate()) {
        ENGINE.frameUpdate = true;
      }
    });
  }

  // Returns indices of object geometry faces that are facing the OCULARIS camera 
  function getFacesToCamera(objectOne) {
    var aligned = { value: null, faceIndices: [] };

    if (objectOne && objectOne.geometry && objectOne.geometry.faces) {
      var faces = objectOne.geometry.faces;
      var cameraLookAt = new THREE.Vector3(0,0, -1);
      var normalMatrix = new THREE.Matrix3().getNormalMatrix(objectOne.matrixWorld);

      cameraLookAt.applyQuaternion(ENGINE.camera.quaternion);
      faces.forEach(function(face, faceIndex) {
        var worldNormal = 
          face.normal.clone().applyMatrix3(normalMatrix).normalize();
        var radiansToLookAt = worldNormal.angleTo(cameraLookAt);
        
        if (aligned.value === radiansToLookAt) {
          aligned.faceIndices.push(faceIndex);
        }
        else if (aligned.value === null || radiansToLookAt > aligned.value) {
          aligned.value = radiansToLookAt;
          aligned.faceIndices = [faceIndex];
        }
      });
    }
    return aligned.faceIndices;
  }

  // Returns object containing information about the distance 
  // between two objects and relative closeness boolean 
  // based on provided vicinity argument
  function getDistanceRelation(objectOne, objectTwo, vicinity) {
    var relation       = {};
    var objectOnePos   = objectOne.position;
    var objectTwoPos   = objectTwo.position;
    var distanceVec = new THREE.Vector3(
      (objectOnePos.x - objectTwoPos.x),
      (objectOnePos.y - objectTwoPos.y),
      (objectOnePos.z - objectTwoPos.z)
    );

    relation.distanceVec = distanceVec;
    relation.distance = objectOnePos.distanceTo(objectTwoPos);
    relation.isClose = (relation.distance < vicinity);

    return relation;
  }

  // Initializes the model instance into separate 
  // OCULARIS model map under OCULARIS.model[modelType]
  function initializeModel(model) {
    var modelInstance;

    if (
      model.type && model.provider && model.displayComponent &&
      typeof OCULARIS.model[model.type] === 'function'
    ) {
      modelInstance = OCULARIS.model[model.type](model);
      ENGINE.models.push(modelInstance);
      modelInstance.init();
    }
  }

  // Initialization is executed immediately upon loading and 
  // returns the ENGINE itself
  return ENGINE.init();
};
