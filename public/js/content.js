OCULARIS.content = function () {
  var ENGINE   = OCULARIS.engine;
  var context  = {
    update: update,
    init: init,
    getDistanceRelation: getDistanceRelation,
    getFacesToCamera: getFacesToCamera
  };

  function update() {
    ENGINE.models.forEach(function(model) {
      if (model.active) model.checkUpdate();
    });
  }

  function init() {
    OCULARIS.config.loadContentStructure(function() {
      ENGINE.availableContent.models.forEach(initializeModel)
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
    // Math.sqrt(
    //   Math.pow(distanceVec.x, 2) +
    //   Math.pow(distanceVec.y, 2) +
    //   Math.pow(distanceVec.z, 2)
    // );
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

  return context;
}