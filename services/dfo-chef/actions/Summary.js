const moment = require('moment');
const database = require('../models/database');
const bot = require('../models/bot');

module.exports = async function Summary(body, dayText) {
  try {
    const { from } = body;
    if (!from) {
      throw new Error('Not found guest info');
    }
    const day = (dayText
      ? moment(dayText, 'DD-MM-YYYY')
      : moment().utcOffset('+07:00')
    ).format('DD-MM-YYYY');

    const groupId = body.conversation.id;
    const orders = await database.Order.findAll({
      where: {
        groupId,
        day
      },
      raw: true
    });

    const sumMap = {};

    let total = 0;
    let quantity = 0;

    orders.forEach(order => {
      const key = `**${order.info.food.name}** ( *${order.info.food.price}k`;
      sumMap[key] = sumMap[key] || [];
      sumMap[key].push(order);
      total += order.info.food.price;
      quantity += order.info.quantity || 1;
    });

    const sum = Object.entries(sumMap)
      .filter(([, items]) => items[0].info.food.price)
      .map(([name, items]) => {
        return `${name} x ${items.length} = ${items[0].info.food.price *
          items.length}k* ):   ${items.map(i => i.info.guest.name).join(', ')}`;
      });

    const sumExtra = Object.entries(sumMap)
      .filter(([, items]) => !items[0].info.food.price)
      .map(([name, items]) => {
        return `${name} x ${items.length} = ${items[0].info.food.price *
          items.length}k* ):   ${items.map(i => i.info.guest.name).join(', ')}`;
      });

    await bot.sendMessage(body.conversation.id, {
      text: `Summary:    **${day}** \n\n ${sum.join(
        '\n\n'
      )} \n\n **QUANTITY:**   ${quantity}\n **TOTAL:**       ${total}k\n\n**EXTRA**\n${sumExtra}`
    });

    const printMap = {};

    orders.forEach(order => {
      const key = `**${order.info.food.name}**`;
      printMap[key] = printMap[key] || [];
      printMap[key].push(order);
    });

    const print = Object.entries(printMap)
      .filter(([, items]) => items[0].info.food.price)
      .map(([name, items]) => {
        return `${name}   :   ${items.length}`;
      });
    const printExtra = Object.entries(printMap)
      .filter(([, items]) => !items[0].info.food.price)
      .map(([name, items]) => {
        return `${name}   :   ${items.length}`;
      });

    await bot.sendMessage(body.conversation.id, {
      text: `**${day}**\n${print.join('\n')}\n\n${printExtra}`
    });
  } catch (e) {
    await bot.sendMessage(body.conversation.id, {
      text: `ERROR: ${e.message}`
    });
  }
};
