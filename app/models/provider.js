'use strict';
/**
 * Database representation of custom provider module. 
 */
module.exports = (sequelize, DataTypes) => {
  let Provider = sequelize.define('Provider', {
    libName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    url: DataTypes.STRING,
    name: DataTypes.STRING,

    //hash of names of input parameters
    requiredParams: {
      type: DataTypes.STRING,
      defaultValue: "[]"
    }
  }, {
    classMethods: {
      associate: (models) => {
        Provider.hasMany(models.ProviderInstance);
        Provider.hasMany(models.ProviderOutput);
      }
    }
  });

  return Provider;
}
