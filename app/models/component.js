'use strict';
/**
 * Database representation of custom component module.
 */
module.exports = (sequelize, DataTypes) => {
  let Component = sequelize.define('Component', {
    libName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    url: DataTypes.STRING,
    name: DataTypes.STRING,
    byNpm: DataTypes.BOOLEAN
  }, {
    classMethods: {
      associate: (models) => {
        Component.hasMany(models.ComponentField);
      }
    }
  });

  return Component;
}
