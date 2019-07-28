const fetch = require('node-fetch');
const moment = require('moment');
const qs = require('querystring');
const gConfig = require('../../../global-config');

let TOKEN;

const botName =
  process.env.NODE_ENV !== 'production' ? 'dfo-chef-dev' : 'dfo-chef';

const getToken = async () => {
  if (TOKEN && Date.now() < TOKEN.expired_at) {
    return TOKEN;
  }

  const res = await fetch(
    'https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token',
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      method: 'POST',
      body: qs.stringify({
        grant_type: 'client_credentials',
        client_id: gConfig['dfo-chef'].bot.id,
        client_secret: gConfig['dfo-chef'].bot.key,
        scope: 'https://api.botframework.com/.default'
      })
    }
  );

  const data = await res.json();

  if (data.error) {
    console.error(data);
  }

  data.expired_at = Date.now() + (data.expires_in / 2) * 1000;

  TOKEN = data;

  return data;
};

const sendMessage = async (
  conversationId,
  { type = 'message', text = '', ...other } = {}
) => {
  const { access_token: token } = await getToken();

  await fetch(
    `https://smba.trafficmanager.net/apis/v3/conversations/${conversationId}/activities`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      method: 'POST',
      body: JSON.stringify({
        type,
        text,
        ...other
      })
    }
  );
};

const getPlainText = body => {
  const {
    entities,
    channelData: { text }
  } = body;

  let plainText = text;
  entities.forEach(entity => {
    if (entity.type === 'mention') {
      while (plainText.indexOf(entity.text) > -1) {
        plainText = plainText.replace(entity.text, '');
      }
    }
  });

  return plainText;
};

const getLines = text => {
  const lines = [];
  (text || '').split('\n').forEach(item => {
    const line = item.trim();
    if (line) {
      lines.push(line);
    }
  });
  return lines;
};

const getMentionedUsers = body => {
  const { entities } = body;
  return entities
    .filter(
      entity => entity.type === 'mention' && entity.text.indexOf(botName) < 0
    )
    .map(entity => ({
      ...entity,
      mentioned: {
        ...entity.mentioned,
        name: entity.text.match(/">(.+?)<\//)[1]
      }
    }));
};

const isOrderExpired = () => {
  const now = moment().utcOffset('+07:00');
  const expiredTime = moment()
    .utcOffset('+07:00')
    .startOf('day')
    .hour(10);
  return now.isAfter(expiredTime);
};

module.exports = {
  getToken,
  sendMessage,
  getLines,
  getPlainText,
  getMentionedUsers,
  isOrderExpired
};
