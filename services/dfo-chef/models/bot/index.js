const fetch = require('node-fetch');
const qs = require('querystring');
const gConfig = require('../../../global-config');

let TOKEN;

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
  { type = 'message', text = '' } = {}
) => {
  const { access_token: token } = await getToken();

  await fetch(
    `https://smba.trafficmanager.net/apis/v3/conversations/${conversationId}/activities`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${token}`
      },
      method: 'POST',
      body: JSON.stringify({
        type,
        text
      })
    }
  );
};

module.exports = {
  getToken,
  sendMessage
};
