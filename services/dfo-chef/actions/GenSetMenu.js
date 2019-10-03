const database = require('../models/database');
const bot = require('../models/bot');
const { isAdmin } = require('../config/power');

module.exports = async function AddFood(body, dayText) {
  try {
    if (!isAdmin(body && body.from && body.from.id)) {
      throw new Error('Require admin permission');
    }
    if(!dayText){
      throw new Error('Missing day');
    }
    const day = bot.getOrderDay(dayText);
    if (day === 'Invalid date') {
      throw new Error('Invalid date (DD-MM-YYYY)');
    }
    const groupId = body.conversation.id;
    const menu = await database.Menu.findOne({
      where: { groupId, day },
      raw: true
    });

    await bot.sendMessage(body.conversation.id, {
      text: `sm ${day}${(menu && menu.value || [])
        .map(i => `\n${i.name} : ${i.price}`)
        .join('')}`
    });
  } catch (e) {
    await bot.sendMessage(body.conversation.id, {
      text: `ERROR: ${e.message}`
    });
  }
};
