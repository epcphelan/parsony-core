/**
 * Signed Request Gate
 * @module /api/gates/signedRequest
 */

const { makeStandardError } = require('../../http');
const { verifySignedByKeyHolder } = require("../../auth");
const { SIGNED:{INVALID_SIGNATURE} } = require('../../errors/errors.json');
const { REQUEST:{ AUTH:{API_KEY}}} = require('../../enums');


/**
 * Check request body for valid signature. Strip signature from request
 * @param req
 * @param payload
 * @return {Promise.<void>}
 */
exports.signedRequestGate = async (req) => {
  const payload = req.body;
  const apiKey = payload[API_KEY];
  const pass = await verifySignedByKeyHolder(apiKey,payload);
  if(!pass) {
    throw makeStandardError(INVALID_SIGNATURE);
  }
};