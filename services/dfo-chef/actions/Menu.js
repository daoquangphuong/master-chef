const bot = require('../models/bot');
const helper = require('../models/helper');
const supplier = require('../models/supplier');

module.exports = async function Menu(body, dayText) {
  try {
    const groupId = body.conversation.id;
    const { day, menu } = await helper.getMenuInfo(groupId, dayText);
    if (!menu) {
      throw new Error(`Not found menu for ${day}`);
    }

    await bot.sendMessage(body.conversation.id, {
      text: `Menu:    **${menu.day}** \n\n${menu.value
        .map(i => `***${i.name}*** :   *${i.price}k*`)
        .join('\n')}`
    });

    const dayOfWeek = bot.dayToMoment(day).day() + 1;

    const comBuiMenu = await supplier.comBui.getMenu(dayOfWeek);

    await bot.sendMessage(body.conversation.id, {
      text: `Cơm bụi online Thứ **${dayOfWeek}** ngày **${
        menu.day
      }** \nPhần ăn bao gồm các món sau:\n${comBuiMenu.foods
        .map((i, idx) => `***${idx + 1}. ${i}***`)
        .join('\n')}`
    });
  } catch (e) {
    await bot.sendMessage(body.conversation.id, {
      text: `ERROR: ${e.message}`
    });
  }
};
