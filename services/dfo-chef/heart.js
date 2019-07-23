const fetch = require('node-fetch');
const gConfig = require('../global-config');

const map = {};

const services = ['skype'];

const isReady = () => Object.keys(map).length === services.length;

const heart = () => {
  const beat = () => {
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
