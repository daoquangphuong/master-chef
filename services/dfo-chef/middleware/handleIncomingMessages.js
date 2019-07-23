const actions = require('../actions');

module.exports = function handleIncomingMessages(req, res) {
  actions(req.body);
  return res.send('Received');
};
