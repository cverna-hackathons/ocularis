'use strict';
/**
 * One output of provider defined by unique name.
 */
module.exports = function(sequelize, DataTypes) {
  var ProviderOutput = sequelize.define('ProviderOutput', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    //provider may define events that control data changes
    isEvent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
        ProviderOutput.belongsTo(models.Provider);
        ProviderOutput.hasOne(models.DataType);
      }
    }
  });
  return ProviderOutput;
};
