const moment = require('moment');
const database = require('../models/database');
const bot = require('../models/bot');

module.exports = async function Menu(body, day) {
  try {
    const id = (day
      ? moment(day, 'DD-MM-YYYY')
      : moment().utcOffset('+07:00')
    ).format('DD-MM-YYYY');
    if (id === 'Invalid date') {
      throw new Error('Invalid date (DD-MM-YYYY)');
    }
    const menu = await database.Menu.findOne({ where: { id }, raw: true });

    if (!menu) {
      throw new Error(`Not found menu for ${id}`);
    }

    await bot.sendMessage(body.conversation.id, {
      text: `Menu:    **${menu.id}** \n\n${menu.value
        .map(i => `***${i.name}*** :   *${i.price}k*`)
        .join(
          '\n'
        )}`
    });
  } catch (e) {
    await bot.sendMessage(body.conversation.id, {
      text: `ERROR: ${e.message}`
    });
  }
};
