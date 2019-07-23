const moment = require('moment');
const database = require('../models/database');
const bot = require('../models/bot');

module.exports = async function Cancel(body) {
  try {
    const { from } = body;
    if (!from) {
      throw new Error('Not found guest info');
    }
    const id = moment().format('DD-MM-YYYY');
    const menu = await database.Menu.findOne({ where: { id }, raw: true });

    if (!menu) {
      throw new Error(`Not found menu for ${id}`);
    }

    await database.Order.destroy({
      where: {
        day: id,
        guestId: from.id
      }
    });

    await bot.sendMessage(body.conversation.id, {
      text: `**${from.name}** cancelled all orders`
    });
  } catch (e) {
    await bot.sendMessage(body.conversation.id, {
      text: `ERROR: ${e.message}`
    });
  }
};
