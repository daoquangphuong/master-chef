const moment = require('moment');
const database = require('../models/database');
const bot = require('../models/bot');
const { isAdmin } = require('../config/power');

module.exports = async function SetMenu(body, menuText) {
  try {
    if (!isAdmin(body && body.from && body.from.id)) {
      throw new Error('Require admin permission');
    }
    const lines = bot.getLines(menuText);
    const [dayText, ...menuListText] = lines;
    if(!dayText){
      throw new Error('Missing day');
    }
    const day = bot.getOrderDay(dayText);
    if (day === 'Invalid date') {
      throw new Error('Invalid date (DD-MM-YYYY)');
    }
    if (!menuListText.length) {
      throw new Error('Please input at least a food');
    }
    const foods = menuListText.map(menu => {
      const [name, price] = menu.split(':');
      if (!name || !name.trim()) {
        throw new Error('Not found food name');
      }
      if (!price || !price.trim()) {
        throw new Error(`Not found food price of '${name}'`);
      }
      return {
        name: name.trim(),
        price: parseInt(price.trim(), 10)
      };
    });
    const groupId = body.conversation.id;
    await database.Menu.create(
      {
        groupId,
        day,
        value: foods
      },
      {
        ignoreDuplicates: true
      }
    );
    await database.Menu.update({ value: foods }, { where: { groupId, day } });
    const menu = await database.Menu.findOne({
      where: { groupId, day },
      raw: true
    });

    await bot.sendMessage(body.conversation.id, {
      text: `Set-Menu:    **${menu.day}** \n${menu.value
        .map(i => `***${i.name}*** :   *${i.price}k*`)
        .join('\n')}`
    });
  } catch (e) {
    await bot.sendMessage(body.conversation.id, {
      text: `ERROR: ${e.message}`
    });
  }
};
