'use strict';
/**
 * As provider modules might have various parameters
 * which alters its function (such as login credentials,
 * initial values etc) user might instantiate multiple
 * providers and use them to render data to components.
 */
module.exports = (sequelize, DataTypes) => {
  let ProviderInstance = sequelize.define('ProviderInstance', {
    //hash of parameters required by specific provider
    paramsHash: {
      type: DataTypes.STRING,
      defaultValue: "{}"
    }
  }, {
    classMethods: {
      associate: (models) => {
        ProviderInstance.belongsTo(models.Provider);
        ProviderInstance.belongsTo(models.User);
        ProviderInstance.hasMany(models.ComponentProviderBinding);
      }
    }
  });

  return ProviderInstance;
}
