/**
 * Cache module using @Redis
 * @module /cache
 */

const { promisify } = require("util");
const redisClient = require("redis").createClient();

/*istanbul ignore next */
redisClient.on("error", function(err) {
  throw new Error(`Redis Error: ${err.toString()}`);
});

/**
 * Set key value pair to cache
 * @param key
 * @param value
 * @return {Promise.<void>}
 */
const set = async (key, value) => {
  try {
    const asyncSet = promisify(redisClient.set).bind(redisClient);
    await asyncSet(key, value);
  } catch (e) {
    //dump error
  }
};

/**
 * Get value for key from cache
 * @param key
 * @return {Promise.<string>}
 */
const get = async key => {
  try {
    const asyncGet = promisify(redisClient.get).bind(redisClient);
    return asyncGet(key);
  } catch (e) {
    //dump error
  }
};

/**
 * Delete key value pair from cache
 * @param key
 * @return {Promise.<void>}
 */
const del = async key => {
  try {
    const asyncDel = promisify(redisClient.del).bind(redisClient);
    await asyncDel(key);
  } catch (e) {
    //dump error
  }
};

/**
 * Flush the entire cache
 * @return {Promise.<void>}
 */
const flushAll = async () => {
  try {
    const asyncFlush = promisify(redisClient.flushall).bind(redisClient);
    await asyncFlush();
  } catch (e) {
    //dump error
  }
};

module.exports = {
  set,
  get,
  del,
  flushAll
};
