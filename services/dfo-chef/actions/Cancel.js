const moment = require('moment');
const database = require('../models/database');
const bot = require('../models/bot');
const { isAdmin } = require('../config/power');

module.exports = async function Cancel(body) {
  try {
    const { from } = body;
    if (!from) {
      throw new Error('Not found guest info');
    }
    if (bot.isOrderExpired()) {
      if (!isAdmin(from.id)) {
        throw new Error('The order time is expired please contact Admin');
      }
    }
    const mentionedUser = bot.getMentionedUsers(body)[0];
    if (mentionedUser) {
      if (!isAdmin(from.id)) {
        throw new Error(
          'Require admin permission to cancel the orders of this person'
        );
      }
      from.id = mentionedUser.mentioned.id;
      from.name = mentionedUser.mentioned.name;
    }
    const id = moment()
      .utcOffset('+07:00')
      .format('DD-MM-YYYY');
    const menu = await database.Menu.findOne({ where: { id }, raw: true });

    if (!menu) {
      throw new Error(`Not found menu for ${id}`);
    }

    await database.Order.destroy({
      where: {
        day: id,
        guestId: from.id
      }
    });

    await bot.sendMessage(body.conversation.id, {
      text: `All orders from **${from.name}**' are cancelled`
    });
  } catch (e) {
    await bot.sendMessage(body.conversation.id, {
      text: `ERROR: ${e.message}`
    });
  }
};
