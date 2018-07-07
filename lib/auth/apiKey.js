/**
 * Auth Module
 * @module /auth/apiKey
 */

const { randomString } = require("../utils");
const { makeStandardError } = require("../http");
const { API_KEY } = require("../errors/errors.json");
const models = require("../models").getModels();
const {
  cacheApiKeyPair,
  cachedApiKeyPair,
  dbApiKeyPair,
  dbDeleteKey,
  unsetCachedApiKey,
  dbToggleKeyEnabled
} = require('./persistence');
/**
 * Checks if the provided API key is valid and if it matches the
 * host of the request.
 * @param apiKey
 * @param hostname
 * @return {Promise.<boolean>}
 */
const validAPIKey = async (apiKey) => {
  const apiKeyFromCache = await cachedApiKeyPair(apiKey);
  if (apiKeyFromCache) {
    return true;
  } else {
    const keyPass = await dbApiKeyPair(apiKey);
    if (keyPass) {
      await cacheApiKeyPair(keyPass.key, keyPass.secret);
      return true;
    } else {
      throw makeStandardError(API_KEY.INVALID);
    }
  }
};

/**
 * Generates a new api key.
 * @return {Promise.<object>}
 */
const createAPIKeyPair = async () => {
  const {ApiKey} = models;
  const key = `${randomString(40)}.key`;
  const secret = `${randomString(40)}.secret`;
  const apiKey =  await ApiKey.create({key, secret});
  return {
    key: apiKey.key,
    secret: apiKey.secret
  };
};

/**
 * Restore API key to enabled.
 * @param apiKey
 * @return {Promise.<void>}
 */
const enableAPIKey = async(apiKey) => {
  await dbToggleKeyEnabled(apiKey, true);
};

/**
 * Set API key to disabled.
 * @param apiKey
 * @return {Promise.<void>}
 */
const disableAPIKey = async (apiKey) =>{
  await unsetCachedApiKey(apiKey);
  await dbToggleKeyEnabled(apiKey, false);
};

/**
 * Delete API key entirely. Used primarily for testing cleanup.
 * @param apiKey
 * @return {Promise.<void>}
 */

const deleteAPIKey = async (apiKey) =>{
  await unsetCachedApiKey(apiKey);
  await dbDeleteKey(apiKey);
};


module.exports = {
  validAPIKey,
  createAPIKeyPair,
  disableAPIKey,
  deleteAPIKey,
  enableAPIKey
};
