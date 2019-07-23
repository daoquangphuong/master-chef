const moment = require('moment');
const database = require('../models/database');
const bot = require('../models/bot');

module.exports = async function Menu(body, day) {
  try {
    const plainDay = (day || '').trim();
    const id = (plainDay ? moment(plainDay, 'DD-MM-YYYY') : moment().utcOffset('+07:00')).format(
      'DD-MM-YYYY'
    );
    if (id === 'Invalid date') {
      throw new Error('Invalid date (DD-MM-YYYY)');
    }
    const menu = await database.Menu.findOne({ where: { id }, raw: true });

    if (!menu) {
      throw new Error(`Not found menu for ${id}`);
    }

    const commands = [
      `*Menu* :   Show menu`,
      `*Order banh gio* :   Order the food "banh gio"`,
      `*Cancel* :   Cancel all your orders`,
      `*Summary* :   Show summary of all orders`,
      `*Random* :   Random guest list`,
    ];

    await bot.sendMessage(body.conversation.id, {
      text: `Menu:    **${menu.id}** \n\n${menu.value
        .map(i => `***${i.name}*** :   *${i.price}k*`)
        .join('\n')}\n\n***Mentions @dfo-chef and use one of the commands***\n\n ${commands.join('\n')}`
    });
  } catch (e) {
    await bot.sendMessage(body.conversation.id, {
      text: `ERROR: ${e.message}`
    });
  }
};
