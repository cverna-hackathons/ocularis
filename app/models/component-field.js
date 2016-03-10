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
        ComponentField.hasOne(models.DataType);
        ComponentField.belongsTo(models.Component);
      }
    }
  });

  return ComponentField;
}
