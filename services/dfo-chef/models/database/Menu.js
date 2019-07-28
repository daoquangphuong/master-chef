const DataType = require('sequelize');
const sequelize = require('./sequelize');

module.exports = sequelize.define(
  'Menu',
  {
    id: {
      type: DataType.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    groupId: {
      type: DataType.STRING,
      validate: {
        notEmpty: true
      }
    },
    day: {
      type: DataType.STRING,
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
    indexes: [
      {
        unique: true,
        fields: ['groupId', 'day']
      }
    ]
  }
);
