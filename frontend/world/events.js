

export default function() {

  // Event listeners container
  let listeners = {};

  /**
   * Maps the key name per keyboard event's key code
   * @param  {Object} event - Keydown event
   * @return {String} key - Key name
   */
  function getKeyboardEventKey(event) {
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

  /**
   * Trigger listener callback bound to keyboard event listener 
   * @param  {Object} event - Keyboard event
   * @return {void}
   */
  function triggerKeyboardEvent(event) {
    triggerEvent(getKeyboardEventKey(event), event);
  }

  /**
   * Trigger listener callback bound to leap event listener 
   * @param  {Object} event - Leap event
   * @param  {Object} options - Event's additional options
   * @return {void}
   */
  function triggerLeapEvent(event, options) {
    triggerEvent(options.name, options);
  }

  /**
   * Trigger listener callback, if any bound 
   * @param  {Object} key - Key name for the triggering event
   * @param  {Object} options - Event's additional options
   * @return {void}
   */
  function triggerEvent(key, options) {
    if (listeners[key]) listeners[key].forEach(obj => obj.callback(options));
  }

  // Set up listening to keyboard events
  function setKeyTriggers() {
    $('body').on('keydown', triggerKeyboardEvent);
  }

  // Set up listening to leap events
  function setLeapTriggers() {
    $('body').on('leapEvent', triggerLeapEvent);
  }

  /**
   * Add listeners for events with common callback 
   * @param  {Object|String} keys - Key names for the triggering event
   * @param  {Function} callback - Trigger callback for event
   * @return {Array} ids - IDs of the event listeners created
   */
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

  /**
   * Add listener for event 
   * @param  {String} key - Key name for the triggering event
   * @param  {Function} callback - Trigger callback for event
   * @param  {String} [id] - Listener ID (concatenation of key name and time integer)
   * @return {String} id - ID of the event listener created
   */
  function addEventListener(key, callback, id) {
    if (!listeners[key]) listeners[key] = [];
    id = (id || ([key, Date.now()].join('-')));
    listeners[key].push({ callback, id });
    return id;
  }
  
  // Removes event listener, found by id
  function removeEventListener(id) {
    for(var key in listeners) {
      for (var i=0, len=listeners[key].length; i<len; i++) {
        if (listeners[key][i].id === id) {
          listeners[key].splice(i, 1);
        }
      }
    }
  }

  // Run from engine, sets up all the triggers
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
