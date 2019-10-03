const database = require('../models/database');
const bot = require('../models/bot');

module.exports = async function Menu(body, dayText) {
  try {
    const day = bot.getOrderDay(dayText);

    if (day === 'Invalid date') {
      throw new Error('Invalid date (DD-MM-YYYY)');
    }

    const groupId = body.conversation.id;
    const menu = await database.Menu.findOne({
      where: { groupId, day },
      raw: true
    });
    if (!menu) {
      throw new Error(`Not found menu for ${day}`);
    }

    await bot.sendMessage(body.conversation.id, {
      text: `Menu:    **${menu.day}** \n\n${menu.value
        .map(i => `***${i.name}*** :   *${i.price}k*`)
        .join('\n')}`
    });
  } catch (e) {
    await bot.sendMessage(body.conversation.id, {
      text: `ERROR: ${e.message}`
    });
  }
};
