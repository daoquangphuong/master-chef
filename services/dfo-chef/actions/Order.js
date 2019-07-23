const moment = require('moment');
const stringSimilarity = require('string-similarity');
const database = require('../models/database');
const bot = require('../models/bot');

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

module.exports = async function Order(body, name) {
  try {
    const { from } = body;
    if (!from) {
      throw new Error('Not found guest info');
    }
    const plainName = name.trim();
    const id = moment().utcOffset('+07:00').format('DD-MM-YYYY');
    const menu = await database.Menu.findOne({ where: { id }, raw: true });

    if (!menu) {
      throw new Error(`Not found menu for ${id}`);
    }

    menu.value.forEach(item => {
      item.rate = stringSimilarity.compareTwoStrings(
        removeUnicode(plainName),
        removeUnicode(item.name)
      );
    });

    const food = menu.value.reduce(
      (max, item) => {
        return max.rate < item.rate ? item : max;
      },
      { notFound: true, rate: 0 }
    );

    if (food.notFound) {
      throw new Error(`Not found the food "${plainName}"`);
    }

    const lastOrder = await database.Order.findOne({
      where: { day: id, guestId: from.id },
      raw: true
    });

    if (lastOrder) {
      throw new Error(
        `You've already ordered "${
          lastOrder.info.food.name
        }". Please cancel it before order new one.`
      );
    }

    await database.Order.create({
      day: id,
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
        quality: 1
      }
    });

    await bot.sendMessage(body.conversation.id, {
      text: `**${from.name}** ordered **${food.name}**   (*${food.price}k*)`
    });
  } catch (e) {
    await bot.sendMessage(body.conversation.id, {
      text: `ERROR: ${e.message}`
    });
  }
};
