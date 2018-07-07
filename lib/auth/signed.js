/**
 * Signed request module
 * @module /auth/signed
 */

const {
  cacheApiKeyPair,
  cachedApiKeyPair,
  dbApiKeyPair
} = require('./persistence');

const { makeStandardError } = require("../http");
const { SIGNED  } = require("../errors/errors.json");
const crypto = require('crypto');

/**
 * Verifies signature in payload for apiKey holder
 * @param apiKey
 * @param payload
 * @return {Promise.<*>}
 */
const verifySignedByKeyHolder = async (apiKey, payload) => {
  const secret = await _getSecretForKeyHolder(apiKey);
  if(secret){
    return verify(payload, secret);
  } else {
    throw makeStandardError(SIGNED.NO_SECRET)
  }
};

/**
 * Adds signed:<sha256 hash> to payload using client secret.
 * @param payload
 * @param secret
 * @return {*}
 */
const sign = (payload, secret) =>{
  const src = JSON.stringify(payload);
  const signature = _hash(src, secret);
  return Object.assign(
    {},
    payload,
    { signed:signature }
  );
};

/**
 * Verifies signature in payload using signature
 * @param payload
 * @param secret
 * @return {boolean}
 */
const verify = (payload, secret) => {
  const { signed } = payload;
  let src = Object.assign({}, payload);
  delete src.signed;
  src = JSON.stringify(src);
  const signature = _hash(src, secret);
  return signature === signed;
};

/**
 * Removed signature from payload.
 * @param payload
 * @return {*}
 */
const unsign = (payload) => {
  const src = Object.assign({}, payload);
  delete src.signed;
  return src;
};

function _hash(src, salt){
  const hash = crypto.createHash('sha256');
  //const hash = crypto.createHmac('sha256', salt);
  hash.update(src);
  hash.update(salt);
  return hash.digest('hex');
}

async function _getSecretForKeyHolder(apiKey){
  const apiKeyFromCache = await cachedApiKeyPair(apiKey);
  if (apiKeyFromCache) {
    return apiKeyFromCache
  } else {
    const keyPass = await dbApiKeyPair(apiKey);
    if (keyPass) {
      await cacheApiKeyPair(keyPass.key, keyPass.secret);
      return keyPass.secret;
    } else {
      return null;
    }
  }
}


module.exports = {
  sign,
  verify,
  unsign,
  verifySignedByKeyHolder
};