module.exports = ENGINE => {
  let draw = () => {
    requestAnimationFrame(draw);
    ENGINE.motion.update();
    if (ENGINE.frameUpdate) {
      console.log('rendering')
      ENGINE.frameUpdate = false;
      ENGINE.renderer.render(ENGINE.scene, ENGINE.camera);
    }
  }
  return draw;
}
