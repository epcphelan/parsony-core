/**
 * Session Token Authentication Gate
 * @module /sessionAuthentication
 */

const { getSession } = require("../../auth");
const { makeStandardError } = require('../../http');
const {SESSION :{NO_TOKEN}} = require('../../errors/errors.json');
const {REQUEST:{HEADERS:{SESSION_TOKEN}}} = require('../../enums');

/**
 *
 * @param req
 * @return {Promise.<*>}
 *
 * @throws Missing token
 */
const sessionAuthenticationGateAsync = async req => {
  const sessionToken = req.get(SESSION_TOKEN);

  if (sessionToken) {
    return await getSession(sessionToken);
  } else {
    throw makeStandardError(NO_TOKEN);
  }
};

module.exports = {
  sessionAuthenticationGateAsync
};