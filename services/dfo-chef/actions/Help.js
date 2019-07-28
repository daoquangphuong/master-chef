const bot = require('../models/bot');

module.exports = async function Help(body) {
  try {
    const commands = `
**Menu**                 :   Show menu ( **M** for short )
**Order**                :   Order the food ( **O** for short )
**Cancel**               :   Cancel all your orders ( **C** for short )
**Summary**              :   Show summary of all orders ( **S** for short )
**Random**               :   Random guest list ( **R** for short )
`.trim();

    await bot.sendMessage(body.conversation.id, {
      text: `Mentions **@dfo-chef** and use one of the commands\n\n${commands}`
    });
  } catch (e) {
    await bot.sendMessage(body.conversation.id, {
      text: `ERROR: ${e.message}`
    });
  }
};
