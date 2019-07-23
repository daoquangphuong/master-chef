const express = require('express');
const helmet = require('helmet');
const compression = require('compression');

const router = express.Router();

const setting = app => {
  app.set('trust proxy', true);
};

router.use(helmet());

router.use(compression());

module.exports = {
  setting,
  router
};
