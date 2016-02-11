/**
 * Asynchronously returns array of threeJS objects
 * @param  {Object}   opt
 * @param  {Function} callback
 */
OCULARIS.model.feed = function (options) {
  var ENGINE  = OCULARIS.engine;
  var cache   = { elements: [] };
  var feedLoading = false;
  var feedActive  = true;
  
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
    return (needsLoad() ? loadElements() : checkComponentsRedraw());
  }

  function checkComponentsRedraw() {
    return;
  }

  function cacheElements(elements) {
    var updateSize = 0;

    elements.forEach(function(elem) {
      var dupe = _.findWhere(cache.elements, { id: elem.id });

      if (dupe) {
        console.log('ERROR: Loaded duplicate | elem:', elem);
      }
      else {
        updateSize++;
        cache.elements.push(elem);
      }
    })
    cache.lastUpdate = Date.now();
    cache.lastUpdateSize = updateSize;
  }

  function loadElements(done) {
    feedLoading = true;
    console.log('loadElements')
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

  return {
    load: loadElements,
    active: feedActive,
    checkUpdate: checkUpdate
  };

};
