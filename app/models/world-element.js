'use strict';
/**
 * World element represents user defined binding of
 * provider instance and component in specific world.
 * e.q. It is Cube component with facebook provider.
 */
module.exports = (sequelize, DataTypes) => {
  let WorldElement = sequelize.define('WorldElement', {
    //position of element in world as hash of position object
    position: {
      type: DataTypes.STRING,
      defaultValue: "{x: 0, y: 0, z: 0}"
    },
    name: DataTypes.STRING
  }, {
    classMethods: {
      associate: (models) => {
        WorldElement.belongsTo(models.World);
        WorldElement.belongsTo(models.ProviderInstance);
        WorldElement.belongsTo(models.Component);
        WorldElement.hasMany(models.ComponentProviderBinding);
      }
    }
  });

  return WorldElement;
}
