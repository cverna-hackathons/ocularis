/**
 * Asynchronously returns array of threeJS objects
 * representing one twitter feed.
 * @param  {Object}   opt
 * @param  {Function} callback
 */
OCULARIS.twitter.feed = (function() {

  function load(feedOptions, displayOptions, done) {

    var tweetElement = OCULARIS.twitter.element;
    var floor;

    feedOptions = _.defaults(feedOptions || {}, {
      // Name of twitter feed for loading data
      channelScreenName: 'jCobbSK',
      // Limit the number of tweets returned
      loadCountLimit: 10
    });

    console.log(feedOptions)
    $.post("/feed", feedOptions, processData);

    function processData(tweets) {
      displayOptions = _.defaults(displayOptions || {}, {
        //position of first element of feed
        initialPosition: new THREE.Vector3(0, 0, 0),
        //direction of elements of feed
        directionVector: new THREE.Vector3(0, 0, 1),
        // Distance between feed elements
        spaceBetweenElements: 5,
      });

      console.log('feedOptions, displayOptions:', feedOptions, displayOptions)
      // console.log(tweets);
      var lineDistance;
      var actualPosition = new THREE.Vector3().copy(displayOptions.initialPosition);
      var shiftVector = new THREE.Vector3()
                          .copy(displayOptions.directionVector)
                          .multiplyScalar(-displayOptions.spaceBetweenElements);

      tweets.forEach(function (tweet) {
        OCULARIS.engine.content.addElement(
          tweetElement({ 
            position: new THREE.Vector3().copy(actualPosition)
          }, tweet), tweet // < - adding for future details recall
        );
        actualPosition.add(shiftVector);
      });

      lineDistance = (displayOptions.spaceBetweenElements * tweets.length);

      floor = OCULARIS.models.floor({
        color: 'blue',
        width: 10,
        height: lineDistance,
        position: {
          x: 0,
          y: 0,
          z: (displayOptions.initialPosition.z - (lineDistance / 2))
        }
      });

      OCULARIS.engine.scene.add(floor);

      if (done) return done();
    }

  }

  return {
    load: load
  };

}) ();
