/**
 * Asynchronously returns array of threeJS objects
 * representing one twitter feed.
 * @param  {Object}   opt
 * @param  {Function} callback
 */
module.exports = function(opt, callback) {

  var tweetElement = require('./element');
  var floor;

  opt = _.defaults(opt || {}, {

    //name of twitter feed for loading data
    channelScreenName: 'jCobbSK',
    //position of first element of feed
    initialPosition: new THREE.Vector3(0, 0, 0),
    //direction of elements of feed
    directionVector: new THREE.Vector3(0, 0, 1),
    // Distance between feed elements
    spaceBetweenElements: 5

  });

  $.ajax({
    method: 'GET',
    url: `/feed/${opt.channelScreenName}`,
    success: function (data) { callback(null, processData(data)); },
    error: function (err) { callback(err); }
  });

  function processData(tweets) {
    var result = [], lineDistance;
    var actualPosition = new THREE.Vector3().copy(opt.initialPosition);
    var shiftVector = new THREE.Vector3()
                        .copy(opt.directionVector)
                        .multiplyScalar(-opt.spaceBetweenElements);

    tweets.forEach(function (tweet) {
      result.push(
        tweetElement(new THREE.Vector3().copy(actualPosition), tweet)
      );
      actualPosition.add(shiftVector);
    });

    lineDistance = (opt.spaceBetweenElements * result.length);

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

    return result;
  }

}
