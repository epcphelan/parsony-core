const twilio = require('twilio');
const promisify = require('util');

let _parsony, _configs;

const KEYS = {
  DEBUG: 'debugRecipient',
  TOKEN: 'token',
  SID: 'sid',
  PHONE: 'phoneNumber'
};

exports.setParsony = function (parsony) {
  _parsony = parsony;
};

exports.setConfigs = function (configs) {
  _configs = configs
};
/*

TODO Implement a testable send end point as well as a receive handler and endpoint.
exports.send = async function (recipientNumber, message) {
  const sms = {
    to: _parsony.env === 'local' ? _configs.twilio[KEYS.DEBUG] : recipientNumber,
    from: _configs.twilio[KEYS.PHONE],
    body: _parsony.env === 'local' ? `### DEBUG ### ${message}` : message
  };
  const client = new twilio.RestClient(_configs.twilio[KEYS.SID], _configs.twilio[KEYS.TOKEN]);
  const sendMessage = promisify(client.sendMessage).bind(client);
  return await sendMessage(sms);
};

*/