/**
 * Asynchronously returns array of threeJS objects
 * representing one twitter feed.
 * @param  {Object}   opt
 * @param  {Function} callback
 */
module.exports = function(opt, callback) {

  let tweetElement = require('./element');

  opt = _.defaults(opt || {}, {

    //name of twitter feed for loading data
    channelScreenName: 'jCobbSK',

    //position of first element of feed
    initialPosition: new THREE.Vector3(0, 0, 0),

    //direction of elements of feed
    directionVector: new THREE.Vector3(0, 0, 1),

    spaceBetweenElements: 1.5

  });

  $.ajax({
    method: 'GET',
    url: `/feed/${opt.channelScreenName}`,
    success: function(data) {
      callback(null, processData(data));
    },
    error: function(err) {
      callback(err);
    }
  });

  function processData(tweets) {
    let result = [];

    let actualPosition = new THREE.Vector3().copy(opt.initialPosition);
    let shiftVector = new THREE.Vector3()
                        .copy(opt.directionVector)
                        .multiplyScalar(opt.spaceBetweenElements);

    tweets.forEach((tweet) => {
      result.push(
        tweetElement(new THREE.Vector3().copy(actualPosition), tweet)
      );
      actualPosition.add(shiftVector);
    });

    return result;
  }

}
