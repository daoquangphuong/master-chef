const sequelize = require('./sequelize');
const Menu = require('./Menu');
const Order = require('./Order');

let retry = 0;

const sync = async () => {
  try {
    retry += 1;
    // sync database
    await sequelize.sync();
    // clean up database
    const query = 'VACUUM FULL';
    await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
  } catch (e) {
    if (retry > 10) {
      throw e;
    }
    console.error(e.message);
    console.info('Retry Sync DB');
    await sync();
  }
};

module.exports = {
  sync,
  Menu,
  Order
};
