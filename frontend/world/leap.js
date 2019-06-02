import { distanceBetween } from '../helpers/measures';

export default function (_engine) {
  // What distance is considered to be close between finger tips
  // Used for pointer events
  const tipVicinity   = 0.03;
  // Leap adds elements to scene within different scale factor, we will use this 
  // custom scale factor to divide the position vectors in order to place pointers
  // to the scene properly
  const scaleFactor   = 700;
  // Delay between registering the same leap event
  const eventDelay    = 700;
  // Finger name to index map
  const fingerNameMap = ['thumb', 'index', 'middle', 'ring', 'pinky'];
  // Hand map
  const handTypes     = ['left', 'right'];

  // Count each cycle in leap controller loop, useful for detecting or delaying
  // changes in pointer events
  let _cycleCounter   = 0;
  let _scene          = _engine.getScene();
  // Initialize leap controller
  let _controller     = new Leap.Controller();
  // Pointers which we will track in the scene (representing fingertips)
  let _pointers = {
    // leftThumb: { color: '#ff0000', idx: 0, object: null, hand: 'left' },
    // leftIndex: { color: '#00ff00', idx: 1, object: null, hand: 'left' },
    // leftMiddle: { color: '#00ff00', idx: 2, object: null, hand: 'left' },
    // rightThumb: { color: '#ff0000', idx: 0, object: null, hand: 'right' },
    // rightIndex: { color: '#00ff00', idx: 1, object: null, hand: 'right' }
  };
  // Our vr enabled 
  let _VRMode = false;
  // Events that we will track and trigger callbacks for if they are registered
  let _events = {
    sign: {
      // Event for pinching thumb and index fingers
      leftPincer: {
        registers: () => {
          let thumb = _pointers.leftThumb.object;
          let index = _pointers.leftIndex.object;

          return pincerBetween(thumb, index);
        }
      },
      rightPincer: {
        registers: () => {
          let thumb = _pointers.rightThumb.object;
          let index = _pointers.rightIndex.object;

          return pincerBetween(thumb, index);
        }
      }
    },
    collision: {
      toCheck: [],
      registers: () => {

      }
    }
  };

  // Initialize this controller
  function init() {
    // Check if we are in vr mode, and set the HMD tracking optimization for leap
    _engine.VRDevicePresent((VRPresent) => {
      _VRMode = VRPresent;
      let camera = _engine.getCamera();

      initPointers();
      _controller.setOptimizeHMD(VRPresent);

      // controller.use('transform', {
      //   // effectiveParent: camera,
      //   // quaternion: camera.quaternion,
      //   // position: new THREE.Vector3(0,0,-200)
      // })
      _controller.loop({ hand: alignPointers })
        .use('handEntry')
        .on('handFound', registerHand)
        .on('handLost', removeFingerPointers);
    });
  }

  function initPointers() {
    handTypes.forEach(handType => {
      fingerNameMap.forEach((fingerName, fingerIdx) => {
        _pointers[[handType, capitalizeFirst(fingerName)].join('')] = {
          color: (fingerIdx ? '#00ff00' : '#ff0000'),
          idx: fingerIdx,
          object: null,
          hand: handType
        }
      });
    });
  }

  function registerHand(hand) {
    _.each(_pointers, (pointer, pointerName) => {
      if (pointerMapsToHand(pointer, hand)) {
        if (!pointer.object) addFingerPointer(pointer);
      }
    });
  }

  // Check if this is the correct hand 
  function pointerMapsToHand(pointer, hand) {
    return (
      hand && hand.fingers && hand.type === pointer.hand && 
      hand.fingers[pointer.idx]
    );
  }

  function pincerBetween(pointerOne, pointerTwo) {
    return (
      pointerOne && pointerTwo ? (
        distanceBetween(pointerOne, pointerTwo) < tipVicinity) : false
    );
  }

  function alignPointers(hand) {
    _cycleCounter++;
    _.each(_pointers, (pointer, pointerName) => {
      if (pointerMapsToHand(pointer, hand)) {
        positionPointerToFinger(pointer, hand.fingers[pointer.idx]);
      }
    });
    checkPointerEvents();
  }

  function checkPointerEvents() {
    checkSignEvents();
    // checkCollisionEvents();
  }

  function checkSignEvents() {
    let nowInt = Date.now();

    _.each(_events.sign, (event, name) => {
      if (
        (!event.lastRegistered || (nowInt - event.lastRegistered) > eventDelay) && 
        event.registers()
      ) {
        // Check for previous registration and clean it, 
        // this is so that we ignore one off firing inaccurate events
        if (event.prevRegistered) {
          event.prevRegistered = false;
        } else {
          event.prevRegistered = true;
          console.log('registered | event name:', name);
          event.lastRegistered = Date.now();
          $('body').trigger('leapEvent', [{ name, event }]);  
        }
        
      }
    });
  }

  function checkCollisionEvents() {
    let nowInt = Date.now();
    
  }

  function addFingerPointer(pointer) {
    pointer.object = new THREE.Mesh(
      new THREE.BoxGeometry(0.002, 0.002, 0.002),
      new THREE.MeshBasicMaterial({ color: pointer.color })
    );
    _scene.add(pointer.object);
  }

  function positionPointerToFinger(pointer, finger) {
    pointer.object.position.copy(
      new THREE.Vector3().fromArray(finger.tipPosition).divideScalar(scaleFactor)
    );

    if (!_VRMode) {
      pointer.object.position.y -= 0.4;
      pointer.object.position.z -= 0.4;
    }
  }

  function removeFingerPointers(removedHand) {
    console.log('!hand removed');
    _.each(_pointers, (pointer, pointerName) => {
      if (pointer.object && removedHand.type === pointer.hand) {
        _scene.remove(pointer.object);
        pointer.object = null;
      }
    });
  }

  function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  return {
    controller: _controller,
    events: _events,
    init
  };
}