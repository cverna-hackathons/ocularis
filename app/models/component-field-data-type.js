'use strict';

module.exports = (sequelize, DataTypes) => {
  let CFDT = sequelize.define('ComponentFieldDataType', {

  }, {
    classMethods: {
      associate: (models) => {
        CFDT.belongsTo(models.ComponentField);
        CFDT.belongsTo(models.DataType);
      }
    }
  });

  return CFDT;
}
