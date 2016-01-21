/**
 * Asynchronously returns array of threeJS objects
 * representing one twitter feed.
 * @param  {Object}   opt
 * @param  {Function} callback
 */
module.exports = function(callback, feedOptions, displayOptions) {

  var tweetElement = require('./element');
  var floor;

  feedOptions = _.defaults(feedOptions || {}, {
    //name of twitter feed for loading data
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
    console.log(tweets)
    var result = [], lineDistance;
    var actualPosition = new THREE.Vector3().copy(displayOptions.initialPosition);
    var shiftVector = new THREE.Vector3()
                        .copy(displayOptions.directionVector)
                        .multiplyScalar(-displayOptions.spaceBetweenElements);

    tweets.forEach(function (tweet) {
      result.push(
        tweetElement(new THREE.Vector3().copy(actualPosition), tweet)
      );
      actualPosition.add(shiftVector);
    });

    lineDistance = (displayOptions.spaceBetweenElements * result.length);

    floor = require('../models/floor')({
      color: 'blue',
      width: 10,
      height: lineDistance,
      position: {
        x: 0,
        y: 0,
        z: -(lineDistance / 2)
      }
    });

    result.push(floor);

    return callback(null, result);
  }

}
