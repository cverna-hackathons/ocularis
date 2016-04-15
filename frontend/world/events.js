export default function() {
  let listeners = {};

  function getKeyboardEventKey(event, trigger) {
    let key;
    switch (event.keyCode) {
      // ArrowUp
      case 38:
        key = 'forward';
        break;
      // ArrowDown
      case 40:
        key = 'backward';
        break;
      // ArrowLeft
      case 37:
        key = 'left';
        break;
      // ArrowRight
      case 39:
        key = 'right';
        break;
      // Spacebar press
      case 32:
        key = 'spacebar';
        break;
      case 13:
        key = 'enter';
        break;
      case 90:
        key = 'z';
        break;
      default:
        key = event.keyCode;
    }
    return key;
  }

  function triggerKeyboardEvent(event) {
    triggerEvent(getKeyboardEventKey(event, 'keydown'), event);
  }

  function triggerLeapEvent(event, options) {
    triggerEvent(options.name, options);
  }

  function triggerEvent(key, event) {
    if (listeners[key]) listeners[key].forEach(obj => obj.callback(event));
  }

  function setKeyTriggers() {
    $('body').on('keydown', triggerKeyboardEvent);
  }

  function setLeapTriggers() {
    $('body').on('leapEvent', triggerLeapEvent);
  }

  function addEventListeners(keys, callback) {
    let ids = [];

    if (keys instanceof Array) {
      ids = keys.map(key => addEventListener(key, callback));
    }
    else if (typeof keys === 'string') { 
      ids.push(addEventListener(keys, callback));
    }
    console.log('addEventListeners | ids:', ids)
    return ids;
  }

  function addEventListener(key, callback, id) {
    if (!listeners[key]) listeners[key] = [];
    id = (id || ([key, Date.now()].join('-')));
    listeners[key].push({ callback, id });
    return id;
  }
  
  function removeEventListener(id) {
    for(var key in listeners) {
      for (var i=0, len=listeners[key].length; i<len; i++) {
        if (listeners[key][i].id === id) {
          listeners[key].splice(i, 1);
        }
      }
    }
  }

  function init() {
    setKeyTriggers();
    setLeapTriggers();
  }

  return {
    getListeners: () => listeners,
    addEventListener,
    addEventListeners,
    removeEventListener,
    init
  };
}
