const moment = require('moment');
const database = require('../models/database');
const bot = require('../models/bot');

module.exports = async function Summary(body) {
  try {
    const { from } = body;
    if (!from) {
      throw new Error('Not found guest info');
    }
    const id = moment()
      .utcOffset('+07:00')
      .format('DD-MM-YYYY');

    const orders = await database.Order.findAll({
      where: {
        day: id
      },
      raw: true
    });

    const sumMap = {};

    let total = 0;
    let quality = 0;

    orders.forEach(order => {
      const key = `**${order.info.food.name}** ( *${order.info.food.price}k`;
      sumMap[key] = sumMap[key] || [];
      sumMap[key].push(order);
      total += order.info.food.price;
      quality += order.info.quality;
    });

    const sum = Object.entries(sumMap).map(([name, items]) => {
      return `${name} x ${items.length} = ${items[0].info.food.price *
        items.length}k* ):   ${items.map(i => i.info.guest.name).join(', ')}`;
    });

    await bot.sendMessage(body.conversation.id, {
      text: `Summary:    **${id}** \n\n ${sum.join(
        '\n\n'
      )} \n\n **QUALITY:**   ${quality}\n **TOTAL:**       ${total}k`
    });
  } catch (e) {
    await bot.sendMessage(body.conversation.id, {
      text: `ERROR: ${e.message}`
    });
  }
};
