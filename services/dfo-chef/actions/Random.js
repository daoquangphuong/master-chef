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
      if(!order.info.food.price){
        return map;
      }
      if (!map[order.guestId]) {
        map[order.guestId] = {
          score: parseInt(Math.random() * 100, 10),
          guest: order.info.guest,
          total: 0,
        };
      }
      map[order.guestId].total += order.info.food.price;
      return map;
    }, {});

    const users = Object.values(userMap);

    users.sort((a, b) => {
      return a.score - b.score;
    });

    await bot.sendMessage(body.conversation.id, {
      text: `Random:   **${day}**\n\n${users
        .map(i => `**${i.guest.name}** *(${i.total}k)*:   *${i.score}*`)
        .join('\n')}`
    });
  } catch (e) {
    await bot.sendMessage(body.conversation.id, {
      text: `ERROR: ${e.message}`
    });
  }
};
