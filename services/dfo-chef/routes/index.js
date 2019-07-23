const express = require('express');
const bodyParser = require('body-parser');
const ping = require('../middleware/ping');
const error = require('../middleware/error');
const handleIncomingMessages = require('../middleware/handleIncomingMessages');
const syncDatabase = require('../middleware/sync-database');

const router = express.Router();

router.use('/ping', ping);

router.use(bodyParser.urlencoded({ extended: true }));

router.use(bodyParser.json());

router.use(syncDatabase);

router.post('/listener', handleIncomingMessages);

// error handler
router.use(error);

module.exports = router;
