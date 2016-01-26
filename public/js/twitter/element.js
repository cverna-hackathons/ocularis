OCULARIS.twitter.element = function(options, tweet) {
  var material;
  var options     = _.defaults(options || {}, {
    size: {
      width: 4,
      height: 8,
      depth: 0.2
    },
    position: {
      x: 0,
      y: 0,
      z: 0
    },
    text: {
      font: "bold 10px Arial",
      color: "black"
    },
    background: 0xeeeeee
  });
  var textResolution = { x: 256, y: 256}
  var dynamicText = new THREEx.DynamicTexture(textResolution.x, textResolution.y);
  
  dynamicText.context.font  = options.text.font;
  dynamicText
    .clear("white")
    .drawText(
      tweet.text, parseInt(textResolution.x * 0.1), 
      parseInt(textResolution.y * 0.1), options.text.color
    );
  material = new THREE.MeshBasicMaterial({ 
    color: options.background, map: dynamicText.texture
  });

  return OCULARIS.models.box({
    x: options.position.x,
    y: options.position.y,
    z: options.position.z,
    size: options.size,
    material: material
  });
}
