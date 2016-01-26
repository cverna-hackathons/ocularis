OCULARIS.motion = function () {

  var baseIncrement = 0.1;
  var maxIncrement  = 1;

  var directionToVector  = {
    forward   : ['z', -1],
    backward  : ['z', 1],
    left      : ['x', -1],
    right     : ['x', 1],
    up        : ['y', -1],
    down      : ['y', 1]
  };

  var cameraVector = {
    x: 0, 
    y: 0,
    z: 0
  };

  var decayVector = {
    x: false,
    y: false,
    z: false
  };

  var incite = function (direction) {
    var operators     = directionToVector[direction];
    var dimension     = operators[0];
    var pointer       = operators[1];
    var curFieldValue = cameraVector[dimension];
    var curFieldAbs   = Math.abs(curFieldValue);

    
    if (curFieldAbs < maxIncrement) {

      cameraVector[dimension] = (
        curFieldValue + (pointer * baseIncrement)
      )
      console.log('incite:', cameraVector, OCULARIS.engine.frameUpdate, cameraVector[dimension])
    }
  };

  var impede = function (direction) {
    var operators     = directionToVector[direction];
    var dimension     = operators[0];

    decayVector[dimension] = true
  };

  var update = function () {
    // Let's update camera if we have vectors
    _.each(cameraVector, (fieldValue, dimension) => {
      if (fieldValue !== 0) {
        OCULARIS.engine.camera['translate' + dimension.toUpperCase()](fieldValue);
        if (decayVector[dimension]) {
          cameraVector[dimension] = (
            Math.abs(fieldValue) > baseIncrement ? (fieldValue / 1.1) : 0
          );
          decayVector[dimension] = (cameraVector[dimension] !== 0)
        }
        console.log('updating motion')

        if (!OCULARIS.engine.frameUpdate) OCULARIS.engine.frameUpdate = true;
      }
    })

  }
  return {
    cameraVector  : cameraVector,
    incite        : incite,
    impede        : impede,
    update        : update
  };
};