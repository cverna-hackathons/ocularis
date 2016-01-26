OCULARIS.content = function () {
  var elements = [];
  var ENGINE   = OCULARIS.engine;

  function addElement(object, params) {
    elements.push({
      object: object,
      params: params
    });
    OCULARIS.engine.scene.add(object);
    OCULARIS.engine.frameUpdate = true;
  }

  function update() {
    if (needsLoad()) {
      console.log('needs load');
    }
    else console.log('no need for update')
  }

  function needsLoad() {
    var res;

    if (elements.length > 0) {
      var lastElement = elements[elements.length - 1].object;
      var lastElementPosition = lastElement.position;
      var currentCameraPosition = ENGINE.camera.position;
      if (withinDistance(2, lastElementPosition, currentCameraPosition)) {
        res = true
      }       
    }
    
    return res;
  }

  function withinDistance(range, elementOnePos, elementTwoPos) {
    //console.log('withinDistance | elementTwoPos, elementOnePos:', elementTwoPos, elementOnePos, elements);
    var xDistance = Math.abs(elementOnePos.x - elementTwoPos.x);
    var yDistance = Math.abs(elementOnePos.y - elementTwoPos.y);
    var zDistance = Math.abs(elementOnePos.z - elementTwoPos.z);

    console.log('xDistance, yDistance, zDistance:', xDistance, yDistance, zDistance);

    return (
      xDistance < range && yDistance < range && zDistance < range
    );
  }

  return {
    addElement: addElement,
    elements: elements,
    update: update
  };
}