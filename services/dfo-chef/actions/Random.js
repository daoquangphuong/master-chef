const moment = require('moment');
const database = require('../models/database');
const bot = require('../models/bot');

module.exports = async function Summary(body) {
  try {
    const day = moment()
      .utcOffset('+07:00')
      .format('DD-MM-YYYY');
    const groupId = body.conversation.id;
    const orders = await database.Order.findAll({
      where: {
        groupId,
        day
      },
      raw: true
    });

    const userMap = orders.reduce((map, order) => {
      if (!map[order.guestId] && order.info.food.price) {
        map[order.guestId] = {
          score: parseInt(Math.random() * 100, 10),
          guest: order.info.guest
        };
      }
      return map;
    }, {});

    const users = Object.values(userMap);

    users.sort((a, b) => {
      return a.score - b.score;
    });

    await bot.sendMessage(body.conversation.id, {
      text: `Random:   **${day}**\n\n${users
        .map(i => `**${i.guest.name}**:   *${i.score}*`)
        .join('\n')}`
    });
  } catch (e) {
    await bot.sendMessage(body.conversation.id, {
      text: `ERROR: ${e.message}`
    });
  }
};
