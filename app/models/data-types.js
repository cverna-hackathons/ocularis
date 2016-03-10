'use strict';
/**
 * System might represent various data types,
 * it can be text, number, image etc etc, these
 * types have to be specified so correct bindings
 * of ProviderOutputs and ComponentFields are created.
 */
module.exports = function(sequelize, DataTypes) {
  var OcularisDataTypes = sequelize.define('DataType', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return OcularisDataTypes;
};
