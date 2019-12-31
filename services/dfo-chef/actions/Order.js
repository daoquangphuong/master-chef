const stringSimilarity = require('string-similarity');
const database = require('../models/database');
const bot = require('../models/bot');
const helper = require('../models/helper');
const { isAdmin } = require('../config/power');

function removeUnicode(inputStr) {
  let str = inputStr;
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(
    /!|@|%|\^|\*|\(|\)|\+|=|<|>|\?|\/|,|\.|:|;|'| |"|&|#|\[|\]|~|$|_/g,
    '-'
  );

  str = str.replace(/-+-/g, '-'); // thay thế 2- thành 1-
  str = str.replace(/^-+|-+$/g, '');

  return str;
}

module.exports = async function Order(body, nameInfo) {
  try {
    const { from } = body;
    if (!from) {
      throw new Error('Not found guest info');
    }
    const mentionedUser = bot.getMentionedUsers(body)[0];
    if (mentionedUser) {
      if (!isAdmin(from.id)) {
        throw new Error('Require admin permission to order for other person');
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
      if (!isAdmin(from.id)) {
        throw new Error('The order time is expired please contact Admin');
      }
    }

    if (!nameInfo && !mentionedUser) {
      await bot.sendMessage(body.conversation.id, {
        text: `Hi *${from.name}*, please order the food.\n...`,
        inputHint: 'expectingInput',
        suggestedActions: {
          to: [body.from.id],
          actions: menu.value.map(i => ({
            type: 'imBack',
            title: `${i.name} ${i.price}k`,
            value: `order ${i.name}`
          }))
        }
      });
      return;
    }

    const [name, extra] = nameInfo.split('-').map(i => (i || '').trim());

    menu.value.forEach(item => {
      item.rate = stringSimilarity.compareTwoStrings(
        removeUnicode(name).replace(/-/g, ' '),
        removeUnicode(item.name).replace(/-/g, ' ')
      );
      item.extraRate = stringSimilarity.compareTwoStrings(
        removeUnicode(extra || '').replace(/-/g, ' '),
        removeUnicode(item.name).replace(/-/g, ' ')
      );
    });

    const food = menu.value.reduce(
      (max, item) => {
        return max.rate < item.rate ? item : max;
      },
      { notFound: true, rate: 0 }
    );

    const extraFoodList = [];

    const extraFood = menu.value.reduce(
      (max, item) => {
        if (item.price < 35) {
          return max;
        }
        extraFoodList.push(item);
        return max.extraRate < item.extraRate ? item : max;
      },
      { notFound: true, extraRate: 0 }
    );

    if (food.notFound) {
      throw new Error(`Not found the food "${name}"`);
    }

    const isExtra = food.name === 'Món ăn thêm';

    if (isExtra) {
      if (extraFood.notFound || !extra) {
        await bot.sendMessage(body.conversation.id, {
          text: `Hi *${from.name}*, please choose the extra food.\n...`,
          inputHint: 'expectingInput',
          suggestedActions: {
            to: [body.from.id],
            actions: extraFoodList.map(i => ({
              type: 'imBack',
              title: `${i.name} ${food.price}k`,
              value: `order ${food.name} - ${i.name}`
            }))
          }
        });
        return;
      }
      food.name = `${food.name} - ${extraFood.name}`;
    }

    await database.Order.create({
      groupId,
      day,
      guestId: from.id,
      info: {
        guest: {
          id: from.id,
          name: from.name
        },
        food: {
          name: food.name,
          price: food.price
        },
        quantity: 1
      }
    });

    const orders = await database.Order.findAll({
      where: { groupId, day, guestId: from.id },
      raw: true
    });

    await bot.sendMessage(body.conversation.id, {
      text: `**${from.name}** ordered:${orders
        .map(i => `\n**${i.info.food.name}** *(${i.info.food.price}k)*`)
        .join('')}`
    });
  } catch (e) {
    await bot.sendMessage(body.conversation.id, {
      text: `ERROR: ${e.message}`
    });
  }
};
