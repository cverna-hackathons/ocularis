'use strict';
/**
 * Represents one part of component which data
 * is rendered to.
 */
module.exports = (sequelize, DataTypes) => {
  let ComponentField = sequelize.define('ComponentField', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    classMethods: {
      associate: (models) => {
        ComponentField.belongsToMany(models.DataType, {
          through: {
            model: models.ComponentFieldDataType
          }
        });
        ComponentField.belongsTo(models.Component);
      }
    }
  });

  return ComponentField;
}
