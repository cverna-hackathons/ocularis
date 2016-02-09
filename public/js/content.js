OCULARIS.content = function () {
  var elements = [];
  var ENGINE   = OCULARIS.engine;
  var context  = {
    elements: elements,
    loadInProgress: false,
    load: null,
    addElement: addElement,
    update: update,
    assignLoadFunction: assignLoadFunction
  };

  function addElement(object, params) {
    elements.push({
      object: object,
      params: params
    });
    OCULARIS.engine.scene.add(object);
    OCULARIS.engine.frameUpdate = true;
  }

  function getLastElement() {
    return (elements.length ? elements[elements.length - 1] : null);
  }

  function update() {
    if (
      !context.loadInProgress && needsLoad() && 
      typeof context.load === 'function'
    ) {
      //console.log('needs load');
      var lastElement = getLastElement();
      var loadOptions = {};
      var displayOptions = {};

      if (lastElement) {
        displayOptions.initialPosition = lastElement.object.position;
        loadOptions.startFrom = lastElement.params.id;
      }
      context.loadInProgress = true;
      context.load(loadOptions, displayOptions, function () {
        context.loadInProgress = false;
      });
    }
    // else console.log('no need for update')
  }

  function assignLoadFunction(fn) {
    context.load = fn
  }

  function needsLoad() {
    var res;

    // console.log('content load is function', (typeof context.load === 'function'))
    var lastElement = getLastElement()

    if (lastElement) {
      var lastElementPosition = lastElement.object.position;
      var currentCameraPosition = ENGINE.camera.position;

      // console.log('lastElementPosition:', lastElementPosition)
      if (withinDistance(10, lastElementPosition, currentCameraPosition)) {
        res = true;
      }
    }
    else res = true;
    
    return res;
  }

  function withinDistance(range, elementOnePos, elementTwoPos) {
    //console.log('withinDistance | elementTwoPos, elementOnePos:', elementTwoPos, elementOnePos, elements);
    var xDistance = Math.abs(elementOnePos.x - elementTwoPos.x);
    var yDistance = Math.abs(elementOnePos.y - elementTwoPos.y);
    var zDistance = Math.abs(elementOnePos.z - elementTwoPos.z);

    // console.log('xDistance, yDistance, zDistance:', xDistance, yDistance, zDistance);

    return (
      xDistance < range && yDistance < range && zDistance < range
    );
  }

  return context;
}