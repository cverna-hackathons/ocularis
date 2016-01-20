var box = require('../models/box');

module.exports = function(position, tweet) {
  return box({
    x: position.x,
    y: position.y,
    z: position.z
  });
}
