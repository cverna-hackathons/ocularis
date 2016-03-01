import {
  createCubeMaterials
} from '../helpers/materials.js';

export default function(opt) {

  var defined = {
    'version': 1,
    'drawables': [
      { 'name': 'Main text', 'id': 'main', 'draw_types': ['text', 'image'] }
    ],
    'events': [
      { 'name': 'Draw next', 'id': 'next', 'key': 'forward'},
      { 'name': 'Draw previous', 'id': 'previous', 'key': 'backward'},
      { 'name': 'Switch left', 'id': 'switchLeft', 'key': 'left'},
      { 'name': 'Switch right', 'id': 'switchRight', 'key': 'right'}
    ]
  };

  opt = _.defaults(opt || {}, {
    size: {
      width: 1,
      height: 1,
      depth: 1
    },
    position: {
      x: 0,
      y: -1,
      z: -2.5
    }
  });

  var geometry = new THREE.CubeGeometry(
    opt.size.width, opt.size.height, opt.size.depth
  );


  var materials = createCubeMaterials({
    color: 0xcccccc,
    text: 'text-cube'
  });
  console.log(geometry)
  var box = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));

  box.position.x = opt.position.x;
  box.position.y = opt.position.y;
  box.position.z = opt.position.z;

  var drawables = {
    main: input => {

    }
  };

  /**
   * Draw incoming data. (For each output draw on the associated drawable)
   * @param  {outputs: [],... } object
   * @param  {event: object, callback: fn} object
   * @return {void}
   */
  function redraw(data, optional) {
    data.outputs.forEach(drawOutput);
  }

  /**
   * Draw data point value onto drawable.
   * @param  { value: '', drawableId: String, draw_type: String} object
   * @return {void}
   */
  function drawOutput(data) {
    if (data.drawableId && draw[data.drawableId]) {
      drawables[data.drawableId](data);
    }
  }

  return {
    defined: defined,
    redraw: redraw,
    object: box
  };
}
