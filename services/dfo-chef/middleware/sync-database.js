const database = require('../models/database');

let isSync = false;

database
  .sync()
  .then(async () => {
    isSync = true;
  })
  .catch(console.error);

module.exports = function syncDatabase(req, res, next) {
  if (isSync) {
    req.database = database;
    next();
  } else {
    next(new Error('Synchronizing database'));
  }
};
