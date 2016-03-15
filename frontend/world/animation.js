let _animations = {};

/**
 * Object animation setup function 
 * @param  {THREE.Object} object that is to be animated
 * @return {Object} Returns iterable object 
 *                  that is used for animation stepping or cancellation 
 */
export function Animate(object) {
  
  let finalCallback = null;
  let interimCallback = null;
  let transforms    = [];
  let id            = (
    Date.now() + '-' + object.id
  );

  let context = {
    id,
    start: (options) => {
      transforms.push(animatedTransform(
        object, options.transformFn, options.deltaVec, options.frameLength
      ));
      _animations[id] = context;
      return context;
    },
    next: () => {
      let formerLen = transforms.length;

      transforms = transforms.filter((transform) => transform.next());
      if (formerLen > transforms.length && typeof interimCallback === 'function') {
        interimCallback(transforms.length);
      }
      return (transforms.length > 0);
    },
    interim: (fn) => {
      if (typeof fn === 'function') interimCallback = fn;
    },
    complete: () => {
      delete _animations[id];
      if (typeof finalCallback === 'function') return finalCallback();
    },
    then: (fn) => {
      if (typeof fn === 'function') finalCallback = fn;
    }
  };

  return context;
}

/**
 * Nudges all registered animations 
 * @return {void}
 */
export function updateAnimations() {
  for (var id in _animations) {
    if (_animations.hasOwnProperty(id)) {
      let anim = _animations[id];
      if (anim.next() === false) {
        anim.complete();
      }
    }
  }
}


/**
 * Transforms (animated) to a vector 
 * (by transforming initial vectors with transform function)
 * @param  {THREE.Object} object that is to be moved
 * @param  {Function} Function that moves, rotates or scales object
 * @param  {THREE.Vector3} Change vector
 * @param  {Integer} Animation frame length
 * @return {Object} Returns iterable object 
 *                  that is used for animation stepping or cancellation 
 */
export function animatedTransform(object, transformFn, deltaVec, frameLength) {
  frameLength = (frameLength || 60);

  // let initialPosition  = object.position.clone();
  let moveIncrementVec = deltaVec.divideScalar(frameLength);
  let framesLeft       = frameLength + 0;
  
  return {
    id: parseInt(Math.random() * 10000).toString(),
    object: object,
    next: () => {
      framesLeft--;
      if (framesLeft > 0 && deltaVec.length() !== 0) {
        transformFn(object, deltaVec);
        return true;
      }
      else return false;
    }
    // , cancel: () => object.position.copy(initialPosition)
  };  
}