const Sequelize = require('sequelize');
const pool = require('./pool');
const gConfig = require('../../../global-config');

module.exports = new Sequelize(gConfig.skype.databaseURL, {
  define: {
    freezeTableName: true
  },
  pool,
  logging: false
  // logging: info => {
  //   const queries = info.split(':');
  //   queries.shift();
  //   const query = queries.join(':').trim();
  //   if (query.indexOf('EXPLAIN') === 0) {
  //     return;
  //   }
  //   sequelize
  //     .query(`EXPLAIN ${query}`, { type: 'SELECT' })
  //     .then(rows => {
  //       console.info('-----');
  //       console.info(query);
  //       console.info(rows);
  //     })
  //     .catch(err => {
  //       console.error(err);
  //     });
  // },
});
