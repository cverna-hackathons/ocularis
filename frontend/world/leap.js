import { distanceBetween } from '../helpers/measures';

export default function (_engine) {
  // What distance is considered to be close between finger tips
  // Used for pointer events
  const tipVicinity   = 0.05;
  // Leap adds elements to scene within different scale factor, we will use this 
  // custom scale factor to divide the position vectors in order to place pointers
  // to the scene properly
  const scaleFactor   = 700;
  // Delay between registering the same leap event
  const eventDelay    = 500;
  // Count each cycle in leap controller loop, useful for detecting or delaying
  // changes in pointer events
  let cycleCounter    = 0;
  let _scene          = _engine.getScene();
  // Initialize leap controller
  let controller  = new Leap.Controller();
  // Finger name to index map
  let fingerNameMap   = ["thumb", "index", "middle", "ring", "pinky"];
  // Pointers which we will track in the scene (representing fingertips)
  let trackedPointers = {
    leftThumb: { color: '#ff0000', idx: 0, object: null, hand: 'left' },
    leftIndex: { color: '#00ff00', idx: 1, object: null, hand: 'left' },
    rightThumb: { color: '#0000ff', idx: 0, object: null, hand: 'right' },
    rightIndex: { color: '#0000ff', idx: 1, object: null, hand: 'right' }
  };
  // Events that we will track and trigger callbacks for if they are registered
  let pointerEvents = {
    // Event for pinching thumb and index fingers
    leftPincer: {
      registers: () => {
        let thumb = trackedPointers.leftThumb.object;
        let index = trackedPointers.leftIndex.object;

        return (
          thumb && index ? (distanceBetween(thumb, index) < tipVicinity) : false
        );
      }
    },
    rightPincer: {
      registers: () => {
        let thumb = trackedPointers.rightThumb.object;
        let index = trackedPointers.rightIndex.object;

        return (
          thumb && index ? (distanceBetween(thumb, index) < tipVicinity) : false
        );
      }
    }
  };



  // Initialize this controller
  function init() {
    // Check if we are in vr mode, and set the HMD tracking optimization for leap
    _engine.VRDevicePresent((VRPresent) => {
      controller.setOptimizeHMD(VRPresent);
      Leap.loop({ hand: registerHand });
    });
  }

  function registerHand(hand) {
    // Sanity check to see if we have the fingers and hand
    if (hand.fingers && hand.fingers.length) {
      _.each(trackedPointers, (pointer, pointerName) => {
        if (hand.type === pointer.hand && hand.fingers[pointer.idx]) {
          if (!pointer.object) addFingerPointer(pointer);
          positionPointerToFinger(pointer, hand.fingers[pointer.idx]);
        }
      });
      checkPointerEvents();
    }
  }

  function checkPointerEvents() {
    let nowInt = Date.now();

    _.each(pointerEvents, (event, name) => {
      if (
        (!event.lastRegistered || (nowInt - event.lastRegistered) > eventDelay) && 
        event.registers()
      ) {
        console.log('registered | event name:', name);
        event.lastRegistered = Date.now();
        $('body').trigger('leapEvent', [{ name, event }]);
      }
    });
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

    pointer.object.position.y -= 0.4;
    pointer.object.position.z -= 0.4;
  }

  function removeFingerPointers(removedHand) {
    console.log('!hand removed')
    _.each(trackedPointers, (pointer, pointerName) => {
      if (pointer.object) _scene.remove(pointer.object);
    });
  }

  return {
    controller,
    pointerEvents,
    init
  };
}