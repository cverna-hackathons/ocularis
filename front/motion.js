module.exports = ENGINE => {

  const baseIncrement             = 0.1;
  const maxIncrement              = 1;

  let directionToVector  = {
    forward   : ['z', -1],
    backward  : ['z', 1],
    left      : ['x', -1],
    right     : ['x', 1],
    up        : ['y', -1],
    down      : ['y', 1]
  };

  let cameraVector = {
    x: 0, 
    y: 0,
    z: 0
  };

  let decayVector = {
    x: false,
    y: false,
    z: false
  }

  let incite = (direction) => {
    let operators     = directionToVector[direction];
    let dimension     = operators[0];
    let pointer       = operators[1];
    let curFieldValue = cameraVector[dimension];
    let curFieldAbs   = Math.abs(curFieldValue);

    if (curFieldAbs < maxIncrement) {
      cameraVector[dimension] = (
        curFieldValue + (pointer * baseIncrement)
      )
    }
  };

  let impede = (direction) => {
    let operators     = directionToVector[direction];
    let dimension     = operators[0];
    
    decayVector[dimension] = true
  };

  let update = () => {
    // Let's update camera if we have vectors
    _.each(cameraVector, (fieldValue, dimension) => {
      if (fieldValue !== 0) {
        console.log('cameraVector:', cameraVector)

        ENGINE.camera['translate' + dimension.toUpperCase()](fieldValue);
        if (decayVector[dimension]) {
          cameraVector[dimension] = (
            Math.abs(fieldValue) > baseIncrement ? (fieldValue / 1.2) : 0
          );
          decayVector[dimension] = (cameraVector[dimension] !== 0)
        }
        if (!ENGINE.frameUpdate) ENGINE.frameUpdate = true;
      }
    })

  }
  return {
    cameraVector: cameraVector,
    incite: incite,
    impede: impede,
    update: update
  };
};