const database = require('../models/database');
const bot = require('../models/bot');
const helper = require('../models/helper');
const { isAdmin } = require('../config/power');

module.exports = async function Cancel(body) {
  try {
    const { from } = body;
    if (!from) {
      throw new Error('Not found guest info');
    }
    const mentionedUser = bot.getMentionedUsers(body)[0];
    const adminPower = isAdmin(from.id);

    if (mentionedUser) {
      if (!adminPower) {
        throw new Error(
          'Require admin permission to cancel the orders of this person'
        );
      }
      from.id = mentionedUser.mentioned.id;
      from.name = mentionedUser.mentioned.name;
    }
    const groupId = body.conversation.id;
    const { day, menu, isAnotherDay } = await helper.getMenuInfo(groupId);

    if (!menu) {
      throw new Error(`Not found menu for ${day}`);
    }

    if (bot.isOrderExpired() && !isAnotherDay) {
      if (!adminPower) {
        throw new Error('The order time is expired please contact Admin');
      }
    }

    await database.Order.destroy({
      where: {
        groupId,
        day,
        guestId: from.id
      }
    });

    await bot.sendMessage(body.conversation.id, {
      text: `All orders from **${from.name}** are cancelled`
    });
  } catch (e) {
    await bot.sendMessage(body.conversation.id, {
      text: `ERROR: ${e.message}`
    });
  }
};
