const DataType = require('sequelize');
const sequelize = require('./sequelize');

module.exports = sequelize.define(
  'Menu',
  {
    id: {
      type: DataType.STRING,
      primaryKey: true,
      validate: {
        notEmpty: true
      }
    },
    value: {
      type: DataType.JSONB,
      defaultValue: null
    }
  },

  {
    indexes: []
  }
);
