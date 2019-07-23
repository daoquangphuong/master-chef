const sequelize = require('./sequelize');
const Menu = require('./Menu');
const Order = require('./Order');

const sync = async () => {
  // sync database
  await sequelize.sync();
  // clean up database
  const query = 'VACUUM FULL';
  await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
};

module.exports = {
  sync,
  Menu,
  Order
};
