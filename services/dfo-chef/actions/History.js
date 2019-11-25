const {Op} = require('sequelize');
const database = require('../models/database');
const bot = require('../models/bot');

module.exports = async function History(body, dayText) {
  try {
    const {from} = body;
    if (!from) {
      throw new Error('Not found guest info');
    }
    const day = bot.getOrderDay(dayText);

    if (day === 'Invalid date') {
      throw new Error('Invalid date (DD-MM-YYYY)');
    }

    const groupId = body.conversation.id;
    const orders = await database.Order.findAll({
      where: {
        groupId,
        createdAt: {[Op.gte]: bot.dayToMoment(day).toDate()},
      },
      raw: true
    });

    const guestMap = {};

    orders.forEach((order) => {
      guestMap[order.guestId] = guestMap[order.guestId] || {
        dayMap: {},
        info: order.info.guest,
      };
      guestMap[order.guestId].dayMap[order.day] = true;
    });

    const guestList = Object.values(guestMap).map((guest) => {
      return {
        score: Object.keys(guest.dayMap).length,
        name: guest.info.name,
      }
    });

    guestList.sort((a,b) => b.score - a.score);

    await bot.sendMessage(body.conversation.id, {
      text: `History From:   **${day}**\n\n${guestList
        .map(i => `**${i.name}**:   *${i.score}*`)
        .join('\n')}`
    });

  } catch (e) {
    await bot.sendMessage(body.conversation.id, {
      text: `ERROR: ${e.message}`
    });
  }
};
