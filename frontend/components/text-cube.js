import {
  createCubeMaterials
} from '../helpers/materials';

/**
 * Construct the component and return exposed functions and objects
 * @param  {Object} size: Object, position: Object
 * @return {Object} object: THREE.js Group
 */
export default function(opt) {

  var defined = {
    'version': 1,
    'drawables': [
      { 'name': 'Main text', 'id': 'main', 'draw_types': ['text', 'image'] }
    ],
    'events': [
      { 'name': 'Draw next', 'trigger': 'next', 'key': 'forward'},
      { 'name': 'Draw previous', 'trigger': 'previous', 'key': 'backward'},
      { 'name': 'Switch left', 'trigger': 'switchLeft', 'key': 'left'},
      { 'name': 'Switch right', 'trigger': 'switchRight', 'key': 'right'}
    ]
  };

  opt = _.defaults(opt || {}, {
    size: {
      width: 1,
      height: 1,
      depth: 1
    },
    position: {
      x: -1,
      y: -1,
      z: -2.5
    }
  });

  var geometry = new THREE.CubeGeometry(
    opt.size.width, opt.size.height, opt.size.depth
  );
  var assistant = new THREE.Mesh(new THREE.CubeGeometry(
    opt.size.width / 3, opt.size.height / 3, opt.size.depth / 3
  ), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));

  var materials = createCubeMaterials({
    color: 0xcccccc,
    text: 'text-cube'
  });
  var box = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
  var component = new THREE.Group();

  component.add(box);
  component.add(assistant);

  assistant.position.set(opt.position.x - 1, opt.position.y + 1, opt.position.z - 1);
  component.position.set(opt.position.x, opt.position.y, opt.position.z);

  var drawables = {
    main: input => {

    }
  };

  /**
   * Draw incoming data. (For each output draw on the associated drawable)
   * @param  {object} outputs: [],...
   * @param  {object} event: object, callback: fn
   * @return {void}
   */
  function redraw(data, options) {
    data.outputs.forEach(drawOutput);
  }

  /**
   * Draw data point value onto drawable.
   * @param  {Object} value: '', drawableId: String, draw_type: String
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
    component: component
  };
}
