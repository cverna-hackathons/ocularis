OCULARIS.content = function () {
  var ENGINE   = OCULARIS.engine;
  var context  = {
    update: update,
    init: init
  };

  function update() {
    ENGINE.models.forEach(function(model) {
      if (model.active) model.checkUpdate();
    });
  }

  function init() {
    OCULARIS.config.loadContentStructure(function() {
      ENGINE.availableContent.models.forEach(initializeModel)
    });
  }

  function initializeModel(model) {
    if (
      model.type && model.provider && model.displayComponent && 
      typeof OCULARIS.model[model.type] === 'function'
    ) ENGINE.models.push(OCULARIS.model[model.type](model));
  }

  return context;
}