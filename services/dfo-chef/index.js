process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
  // send entire app down. Process manager will restart it
  process.exit(1);
});

const express = require('express');
const cors = require('cors');
const gConfig = require('../global-config');
const generalRoutes = require('./routes/general');
const routes = require('./routes');

require('./heart')();

const app = express();

generalRoutes.setting(app);

app.use(generalRoutes.router);

app.use(
  '/skype',
  cors({ origin: [/https:\/\/[^.]+\.free4talk.com$/, gConfig.skype.domain] }),
  routes
);

app.listen(gConfig.skype.port, () => {
  console.info(
    `You can now view dfo-skype-bot in the browser. \n\n http://localhost:${
      gConfig.skype.port
    } \n`
  );
});
