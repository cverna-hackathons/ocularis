OCULARIS.createEngine = function () {
  var ENGINE = {
    models: [],
    init: function () {
      var redBox   = OCULARIS.component.pointer();

      ENGINE.VREnabled= false
      ENGINE.light    = OCULARIS.light();
      ENGINE.scene    = OCULARIS.scene();
      ENGINE.renderer = OCULARIS.renderer();
      ENGINE.motion   = OCULARIS.motion();
      ENGINE.draw     = OCULARIS.draw();
      ENGINE.view     = OCULARIS.view();
      
      OCULARIS.config.loadContentStructure(function() {
        ENGINE.availableContent.models.forEach(initializeModel)
      });

      ENGINE.view.reset();
      ENGINE.scene.add(redBox);
      ENGINE.scene.add(ENGINE.light);
      ENGINE.draw();
      
      // Set events
      return ENGINE;
    },
    switchVR: function () {
      ENGINE.VREnabled = !ENGINE.VREnabled;
      ENGINE.view.reset();
      console.log('switching to VR:', ENGINE.VREnabled)
    },
    enableVR: function () {
      ENGINE.VRControls = new THREE.VRControls(ENGINE.camera);
      ENGINE.VREffect   = new THREE.VREffect(ENGINE.renderer);

      ENGINE.VREffect.setSize(window.innerWidth, window.innerHeight);
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

  function update() {
    ENGINE.models.forEach(function(model) {
      if (model.active) model.checkUpdate();
    });
  }

  function getFacesToCamera(objectOne) {
    // var mostAlignedFaces = [];
    var aligned = { value: null, faces: [] };

    if (objectOne && objectOne.geometry && objectOne.geometry.faces) {
      var faces = objectOne.geometry.faces;
      var cameraLookAt = new THREE.Vector3(0,0, -1);

      cameraLookAt.applyQuaternion(ENGINE.camera.quaternion);
      faces.forEach(function(face) {
        var radiansToLookAt = face.normal.angleTo(cameraLookAt);
        // console.log('radiansToLookAt, face.normal, cameraLookAt:', radiansToLookAt, face.normal, cameraLookAt);
        if (aligned.value === radiansToLookAt) {
          aligned.faces.push(face);
        }
        else if (aligned.value === null || radiansToLookAt > aligned.value) {
          aligned.value = radiansToLookAt;
          aligned.faces = [face];
        }
      });
    }
    return aligned.faces;
  }

  // Helpers
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

  return ENGINE.init();
};