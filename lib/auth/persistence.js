/**
 * Persistence methods for auth module
 * @module auth/persistence
 */

const cache = require("../cache").getCache();
const models = require("../models").getModels();
const cachedAPIKeyPrefix = "APIKey:";

/**
 * Save key and secret to cache
 * @param apiKey
 * @param secret
 * @return {Promise.<void>}
 */
const cacheApiKeyPair = async (apiKey, secret) => {
  const cacheAPIKey = cachedAPIKeyPrefix + apiKey;
  await cache.set(cacheAPIKey, secret);
};

/**
 * Retrieve cached secret for apiKey
 * @param apiKey
 * @return {Promise.<string>}
 */
const cachedApiKeyPair = async (apiKey) => {
  const cacheAPIKey = cachedAPIKeyPrefix + apiKey;
  return await cache.get(cacheAPIKey);
};

/**
 * Get key and secret from DB
 * @param apiKey
 * @return {Promise.<*>}
 */
const dbApiKeyPair = async (apiKey) => {
  const { ApiKey } = models;
  const keyPass = await ApiKey.findOne({
    where: {
      key: apiKey,
      enabled: true,
    },
  });
  if (keyPass) {
    return {
      key: keyPass.key,
      secret: keyPass.secret,
    };
  } else {
    return false;
  }
};

/**
 * Delete API key pair from DB
 * @param apiKey
 * @return {Promise.<void>}
 */
const dbDeleteKey = async (apiKey) => {
  await models.ApiKey.destroy({
    where: {
      key: apiKey,
    },
  });
};

/**
 * Flush key paid from cache
 * @param apiKey
 * @return {Promise.<void>}
 */
const unsetCachedApiKey = async (apiKey) => {
  const cached = cachedAPIKeyPrefix + apiKey;
  await cache.del(cached);
};

/**
 * Toggle API key enabled state in DB
 * @param apiKey
 * @param enabled
 * @return {Promise.<void>}
 */
const dbToggleKeyEnabled = async (apiKey, enabled) => {
  await models.ApiKey.update(
    {
      enabled: enabled,
    },
    {
      where: {
        key: apiKey,
      },
    },
  );
};

module.exports = {
  cacheApiKeyPair,
  cachedApiKeyPair,
  dbApiKeyPair,
  dbDeleteKey,
  unsetCachedApiKey,
  dbToggleKeyEnabled,
};
