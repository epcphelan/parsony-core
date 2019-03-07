/**
 * API Key Gate
 * @module /api/gates/apiKey
 */

const { makeStandardError } = require('../../http');
const { validAPIKey } = require("../../auth");
const { API_KEY:{ NONE_RECEIVED} } = require('../../errors/errors.json');
const { REQUEST:{ AUTH:{API_KEY}}} = require('../../enums');


/**
 * Check if API key is provided and valid. If not, throw HTTP Error Object.
 * @param req - Express request object
 * @returns {Promise.<bool>}
 */
exports.apiKeyGateAsync = async req => {
  const payload = req.body;
  const apiKey = payload[API_KEY];
  if (apiKey) {
    return await validAPIKey(apiKey);
  } else {
    throw makeStandardError(NONE_RECEIVED)
  }
};