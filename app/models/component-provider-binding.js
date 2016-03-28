'use strict';
/**
 * Binding of specific component field and provider output in
 * world element.
 */
module.exports = (sequelize, DataTypes) => {
  let ComponentProviderBinding = sequelize.define('ComponentProviderBinding', {
  }, {
    classMethods: {
      associate: (models) => {
        ComponentProviderBinding.belongsTo(models.WorldElement);
        ComponentProviderBinding.belongsTo(models.ProviderOutput);
        ComponentProviderBinding.belongsTo(models.ComponentField);
        ComponentProviderBinding.belongsTo(models.Event);
      }
    }
  });

  return ComponentProviderBinding;
}
