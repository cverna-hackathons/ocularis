OCULARIS.config = (function() {
  var config = {
    feed: {
      source: 'twitter/feed',
      displayOptions: {
        spaceBetweenElements: 20,
        //position of first element of feed
        initialPosition: new THREE.Vector3(0, 0, 0),
        // Direction of feed elements
        directionVector: new THREE.Vector3(0, 0, 1)
      }
    }
  };

  return config;
}) ();