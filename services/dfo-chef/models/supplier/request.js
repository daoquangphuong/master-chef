const util = require('util');

const requestModule = require('request');

const request = util.promisify(requestModule);
request.get = util.promisify(requestModule.get);
request.post = util.promisify(requestModule.post);
request.put = util.promisify(requestModule.put);
request.patch = util.promisify(requestModule.patch);
request.del = util.promisify(requestModule.del);
request.head = util.promisify(requestModule.head);
request.options = util.promisify(requestModule.options);

module.exports = request;
