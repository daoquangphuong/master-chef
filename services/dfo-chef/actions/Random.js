const moment = require('moment');
const database = require('../models/database');
const bot = require('../models/bot');

module.exports = async function Summary(body) {
  try {
    const id = moment()
      .utcOffset('+07:00')
      .format('DD-MM-YYYY');

    const orders = await database.Order.findAll({
      where: {
        day: id
      },
      raw: true
    });

    orders.forEach(order => {
      order.score = parseInt(Math.random() * 100, 10);
    });

    orders.sort((a, b) => {
      return a.score - b.score;
    });

    await bot.sendMessage(body.conversation.id, {
      text: `Random:   **${id}**\n\n${orders
        .map(i => `**${i.info.guest.name}**:   *${i.score}*`)
        .join('\n')}`
    });
  } catch (e) {
    await bot.sendMessage(body.conversation.id, {
      text: `ERROR: ${e.message}`
    });
  }
};