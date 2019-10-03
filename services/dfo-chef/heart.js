const fetch = require('node-fetch');
const moment = require('moment');
const gConfig = require('../global-config');

const map = {};

const services = ['dfo-chef'];

const isReady = () => Object.keys(map).length === services.length;

const heart = () => {
  const beat = () => {
    const hour = moment()
      .utcOffset('+07:00')
      .format('HH');
    if (parseInt(hour, 10) >= 18 || parseInt(hour, 10) < 6) {
      return;
    }
    services.forEach(service => {
      fetch(`${gConfig[service].domain}/${service}/ping`)
        .then(() => {
          if (map[service]) {
            return;
          }
          map[service] = true;
          if (isReady()) {
            console.info(`ALL SERVICES ARE READY`);
          }
        })
        .catch(() => {});
    });
    setTimeout(beat, isReady() ? 30000 : 5000);
  };

  beat();
};

module.exports = heart;
