/**
 * SMS Module
 * @module /sms/sms.js
 */

const twilio = require('twilio');
const {
  CONFIG: {
    TWILIO,
    DEBUG_RECIP,
    PHONE,
    SID,
    TOKEN
  }
} = require("../enums");
let _parsony, _configs;

const setParsony = parsony => (_parsony = parsony);

const setConfigs = configs => (_configs = configs);

const send = async (recipient, message) => {
  const sms = {
    to: _parsony.debugMode ? _getDebugRecipient() : recipient,
    from: _configs[TWILIO][PHONE],
    body: _parsony.debugMode  ? `### DEBUG ### ${message}` : message
  };
  const client = new twilio(_configs[TWILIO][SID], _configs[TWILIO][TOKEN]);
  return client.messages.create(sms);
};

function _getDebugRecipient(){
  return _configs[TWILIO][DEBUG_RECIP];
}

module.exports = {
  setParsony,
  setConfigs,
  send
};