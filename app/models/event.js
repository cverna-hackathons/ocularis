'use strict';
/**
 * Specific events defined by Ocularis dev team,
 * these events may be bind to event provider outputs.
 */
module.exports = (sequelize, DataTypes) => {
  let Event = sequelize.define('Event', {
    name: DataTypes.STRING
  }, {
    classMethods: {
      associate: (models) => {
      }
    }
  });

  return Event;
}
