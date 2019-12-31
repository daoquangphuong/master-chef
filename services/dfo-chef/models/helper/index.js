const database = require('../database');
const bot = require('../bot');

const getMenuInfo = async (groupId, dayText) => {
  let day = bot.getOrderDay(dayText);

  if (day === 'Invalid date') {
    throw new Error('Invalid date (DD-MM-YYYY)');
  }

  let menu = await database.Menu.findOne({
    where: { groupId, day },
    raw: true
  });

  let count = 0;
  while (!menu && count <= 3) {
    count += 1;
    day = bot.getNextDay(day);
    // eslint-disable-next-line no-await-in-loop
    menu = await database.Menu.findOne({
      where: { groupId, day },
      raw: true
    });
  }

  return {
    menu,
    day,
    isAnotherDay: count > 0
  };
};

module.exports = {
  getMenuInfo
};
