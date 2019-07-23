const path = require('path');

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line global-require
  const dotenv = require('dotenv');

  dotenv.config({ path: path.resolve(__dirname, '.env') });
}

module.exports = {
  'dfo-chef': {
    port: process.env.DFO_CHEF_PORT || process.env.PORT,
    databaseURL: process.env.DFO_CHEF_DATABASE_URL || process.env.DATABASE_URL,
    domain:
      process.env.NODE_ENV !== 'production'
        ? 'http://localhost:7788'
        : 'https://dfo-chef.herokuapp.com',
    bot: {
      id: process.env.BOT_ID,
      key: process.env.BOT_KEY
    }
  }
};
