'use strict';
/**
 * World represents user's scene. User might have
 * set multiple worlds, for example specific
 * for social media, entertainment etc.
 */
module.exports = (sequelize, DataTypes) => {
  let World = sequelize.define('World', {
    name: DataTypes.STRING,
    index: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    classMethods: {
      associate: (models) => {
        World.belongsTo(models.User);
        World.hasMany(models.WorldElement);
      }
    }
  });

  return World;
}
