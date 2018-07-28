const {
  checkCredentials,
  getSession,
  createSession,
  destroySession,
  extendSession
} = require('./session');

const {
  validAPIKey,
  createAPIKeyPair,
  disableAPIKey,
  deleteAPIKey,
  enableAPIKey
} = require('./apiKey');

const {
  sign,
  verify,
  unsign,
  verifySignedByKeyHolder
} = require('./signed');

module.exports = {
  checkCredentials,
  getSession,
  createSession,
  destroySession,
  extendSession,
  validAPIKey,
  createAPIKeyPair,
  disableAPIKey,
  deleteAPIKey,
  enableAPIKey,
  sign,
  unsign,
  verify,
  verifySignedByKeyHolder
};