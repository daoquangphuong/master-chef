const moment = require('moment');
const database = require('../models/database');
const bot = require('../models/bot');
const { isAdmin } = require('../config/power');

module.exports = async function SetMenu(body, menuText) {
  try {
    if (!isAdmin(body && body.from && body.from.id)) {
      throw new Error('Require admin permission');
    }
    const lines = menuText
      .split('\n')
      .map(i => i.trim())
      .filter(i => i);
    const [day, ...menus] = lines;
    const id = moment(day, 'DD-MM-YYYY').format('DD-MM-YYYY');
    if (id === 'Invalid date') {
      throw new Error('Invalid date (DD-MM-YYYY)');
    }
    if (!menus.length) {
      throw new Error('Please input at least a food');
    }
    const foods = menus.map(menu => {
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
    await database.Menu.create(
      {
        id,
        value: foods
      },
      {
        ignoreDuplicates: true
      }
    );
    await database.Menu.update({ value: foods }, { where: { id } });
    const menu = await database.Menu.findOne({ where: { id }, raw: true });

    await bot.sendMessage(body.conversation.id, {
      text: `Set-Menu:    **${menu.id}** \n${menu.value
        .map(i => `***${i.name}*** :   *${i.price}k*`)
        .join('\n')}`
    });
  } catch (e) {
    await bot.sendMessage(body.conversation.id, {
      text: `ERROR: ${e.message}`
    });
  }
};
