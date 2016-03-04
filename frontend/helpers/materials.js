/**
 * Create multi mesh material for a cube.
 * @param  {options}    object with options for material generation
 * @return {materials}  array of materials for a cube
 */
export function createCubeMaterials(options) {
  var materials = [];

  for (var materialIdx = 0; materialIdx < 6; materialIdx++) {
    var materialOptions = {
      color: options.color,
      map: buildTextureFromText(options.text, 512)
    };
    materials.push(new THREE.MeshBasicMaterial(materialOptions));
  }
  return materials;
}

/**
 * Create texture from canvas with text wrap
 * @param  {String} Text to render into texture
 * @param  {Number} Size for texture (has to be power of 2)
 * @return {THREE.Texture} Can be assigned as a material.map
 */
export function buildTextureFromText(text, size) {
  var texture = new THREE.Texture(getCanvasWithTextWrap(text, {
    maxWidth: size
  }));

  texture.needsUpdate  = true;
  return texture;
}

/**
 * Create canvas with text filled within width / height boundaries
 * @param  {String} Text to render into texture
 * @param  {Object} fontSize, fontColor, maxWidth, background
 * @return {Canvas element} Can be assigned as a material.map
 */
function getCanvasWithTextWrap(text, options) {

  var i, j, lines, lineSpacing, projectedHeight;
  var canvas      = document.createElement('canvas');
  var ctx         = canvas.getContext('2d');
  var width       = 0;
  var fontSize    = (options.fontSize || 50);
  var fontFace    = (options.fontFace || 'Arial');
  var maxWidth    = (options.maxWidth || 512);
  var fontColor   = (options.fontColor || "#000000");
  var background  = (options.background || "#ffffff");

  ctx.canvas.width  = maxWidth;
  ctx.canvas.height = maxWidth;

  do {
    // Calculate canvas size, add margin
    adjustToFontSize();
    fontSize--;
  } while (fontSize > 0 && projectedHeight > options.maxWidth);

  // since we are in a cube, we use the same height and width
  ctx.font   = fontSize + "px Arial";

  // Render
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = fontColor;
  j = lines.length;

  for (i=0; i < j; i++) {
    ctx.fillText(
      lines[i], lineSpacing, ((fontSize + lineSpacing) * (i + 1))
    );
  }

  return canvas;

  function adjustToFontSize() {
    var textCopy = '' + text;
    var len = textCopy.length;
    var result;

    lineSpacing = parseInt(fontSize / 2);
    projectedHeight = lineSpacing;
    lines = new Array();

    // Measure text and calculate width
    // Font and size is required for ctx.measureText()
    ctx.font   = (fontSize + 'px ' + fontFace);

    while (textCopy.length) {
      for(i=len; (ctx.measureText(textCopy.substr(0, i)).width + lineSpacing) > maxWidth; i--);
      result = textCopy.substr(0,i);

      if (i !== textCopy.length)
        for( j=0; result.indexOf(" ",j) !== -1; j=result.indexOf(" ",j)+1 );

      lines.push(result.substr(0, j || result.length));
      width = Math.max(width, ctx.measureText(lines[ lines.length-1 ]).width);
      textCopy = textCopy.substr(lines[ lines.length-1 ].length, textCopy.length);
      projectedHeight += (fontSize + lineSpacing);
    }
  }
}
