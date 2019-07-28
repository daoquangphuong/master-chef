const DataType = require('sequelize');
const sequelize = require('./sequelize');

module.exports = sequelize.define(
  'Order',
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
    guestId: {
      type: DataType.STRING,
      validate: {
        notEmpty: true
      }
    },
    info: {
      type: DataType.JSONB,
      defaultValue: null
    }
  },

  {
    indexes: [
      {
        unique: true,
        fields: ['groupId', 'day', 'guestId']
      }
    ]
  }
);
