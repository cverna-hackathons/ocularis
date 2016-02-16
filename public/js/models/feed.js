/**
 * Asynchronously returns array of threeJS objects
 * @param  {Object}   opt
 * @param  {Function} callback
 */
OCULARIS.model.feed = function (options) {
  var components    = [];
  var ENGINE        = OCULARIS.engine;
  var cache         = { elements: [] };
  var componentType = options.displayComponent;
  var feedLoading   = false;
  var feedActive    = true;
  var cameraVicinity= 10;
  // serves as a binding back from component
  var componentModel= {
    eventStart: function(options) {
      console.log('eventStart', options);
      componentModel.nextElement = null;
      if (options.type === 'shift') {
        switch(options.direction) {
          case 'forward':
            prepAnotherElement(1);
            break;
          case 'backward':
            prepAnotherElement(-1);
            break;
          case 'forward':
            // TODO: Go to shift provider channel
            prepAnotherElement(1);
            break;
          case 'left':
            // TODO: Go to shift provider channel
            prepAnotherElement(-1);
            break;
        }
      }
    },
    eventStop: function(options) {
      console.log('eventStop', options);
    },
    nextElement: null,
    currentElementID: null,
    componentLoading: feedLoading
  };

  function getElementCacheIdx(elementID) {
    elementID = elementID || componentModel.currentElementID;

    return _.findIndex(cache.elements, function(element) {
      return (element.id === elementID);
    });
  }

  function prepAnotherElement(shift) {
    var currentPos = getElementCacheIdx();
    var nextPos    = (currentPos + shift);
    var nextElement= cache.elements[nextPos];

    if (nextElement) {
      console.log('getAnotherELement | nextElement:', nextElement);
      componentModel.nextElement = nextElement;
      componentModel.currentElementID = nextElement.id;
    }
    else {
      console.log('getAnotherELement | not found in cache (currentPos), cache.elements:', currentPos, cache.elements);
    }
    return;
  }

  function shiftProviderChannel(direction) {

  }

  function loadElements(done) {
    feedLoading = true;
    console.log('loadElements');
    getUserFeedOptions(function(errors, userFeedOptions) {
      $.post("/feed", userFeedOptions, function(response) {
        console.log('loadElements | response:', response);
        if (response && response.elements) {
          cacheElements(response.elements);
        }
        else {
          console.log('ERROR: Loading feed data | response:', response);
        }
        feedLoading = false;
        if (done) return done();
      });
    });
  }

  // Initializes the model component
  function init() {
    console.log('init feed');
    var component = OCULARIS.component[componentType]({
      componentModel: componentModel
    });
    component.place();
    components.push(component);
    ENGINE.frameUpdate = true;

    bindEventTriggers();
  }

  // This function will load users preferred or default feed options
  function getUserFeedOptions (done) {
    return done(null, _.extend(
      _.clone(OCULARIS.defaults.feedOptions[options.provider]), options
    ));
  }

  function needsLoad() {
    return (cache.elements.length === 0 && feedLoading === false);
  }

  function checkUpdate() {
    if (needsLoad()) {
      loadElements();
      return false;
    }
    else {
      return checkComponentsRedraw();
    }  
  }

  function checkComponentsRedraw() {
    var redraw = false;
    components.forEach(function(component) {
      if (component.check()) redraw = true;
    });

    return redraw;
  }

  function cacheElements(elements) {
    var updateSize = 0;
    var firstLoad   = (!cache.lastUpdate && elements.length);

    elements.forEach(function(elem) {
      var dupe = _.findWhere(cache.elements, { id: elem.id });

      if (dupe) {
        console.log('ERROR: Loaded duplicate | elem:', elem);
      }
      else {
        updateSize++;
        cache.elements.push(elem);
      }
    });
    if (firstLoad) {
      componentModel.currentElementID = elements[0].id;
      componentModel.nextElement = elements[0];
    }
    cache.lastUpdate = Date.now();
    cache.lastUpdateSize = updateSize;
  }

  /**
   * Bind events for rotating cube.
   */
  function bindEventTriggers() {
    OCULARIS.engine.events.addEventListener('forward', function () {
      rotateCube('forward');
    });
    OCULARIS.engine.events.addEventListener('backward', function () {
      rotateCube('backward');
    });
    OCULARIS.engine.events.addEventListener('left', function () {
      rotateCube('left');
    });
    OCULARIS.engine.events.addEventListener('right', function () {
      rotateCube('right');
    });
  }

  function rotateCube(direction) {
    components.forEach(function(component){
      //TODO check if component has rotate
      component.rotate(direction);
    });
  }

  return {
    load: loadElements,
    components: components,
    active: feedActive,
    checkUpdate: checkUpdate,
    init: init
  };

};
