export default function() {
  var listeners = {};

  function getEventKeyDirection (event, trigger) {
    // console.log('getEventKeyDirection | event.keyCode:', event.keyCode, trigger);
    var key;
    switch (event.keyCode) {
      // W-key
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
    }
    return key;
  }

  function trackKeys (event) {
    triggerKeyEvent(getEventKeyDirection(event, 'keydown'));
  }

  function setTriggers () {
    $('body').on('keydown', trackKeys);
  }

  function triggerKeyEvent(key) {
    if (listeners[key]) listeners[key].forEach(obj => {
      return obj.callback()
    });
  }

  function addEventListener(key, done, id) {
    if (!listeners[key]) listeners[key] = [];
    id = (id || Date.now());
    listeners[key].push({ callback: done, id: id });
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

  setTriggers();

  return {
    getListeners: () => listeners,
    addEventListener,
    removeEventListener
  };
}
