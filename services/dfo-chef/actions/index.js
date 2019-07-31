const Help = require('../actions/Help');
const GenSetMenu = require('../actions/GenSetMenu');
const SetMenu = require('../actions/SetMenu');
const Menu = require('../actions/Menu');
const Order = require('../actions/Order');
const Cancel = require('../actions/Cancel');
const Summary = require('../actions/Summary');
const Random = require('../actions/Random');
const bot = require('../models/bot');

module.exports = function handler(body) {
  const { type, text, channelId } = body;
  if (!text || type !== 'message' || channelId !== 'skype') {
    return;
  }
  const plainText = bot.getPlainText(body).trim();
  const commandMatch = plainText.match(/^([^\s]+)(\s+[\s\S]+)?/im);
  if (!commandMatch) {
    return;
  }
  const command = commandMatch[1].trim().toLowerCase();
  const params = (commandMatch[2] || '').trim();
  switch (command) {
    case 'set-menu':
    case 'sm': {
      SetMenu(body, params);
      break;
    }
    case 'gen-set-menu':
    case 'gsm': {
      GenSetMenu(body, params);
      break;
    }
    case 'menu':
    case 'm': {
      Menu(body, params);
      break;
    }
    case 'order':
    case 'o': {
      Order(body, params);
      break;
    }
    case 'cancel':
    case 'c': {
      Cancel(body, params);
      break;
    }
    case 'summary':
    case 's': {
      Summary(body, params);
      break;
    }
    case 'random':
    case 'r': {
      Random(body, params);
      break;
    }
    default: {
      Help(body);
      break;
    }
  }
};
