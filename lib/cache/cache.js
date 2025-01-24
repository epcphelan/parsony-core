/**
 * Cache module using @Redis
 * @module /cache
 */

const { promisify } = require("util");
const {CONFIG:{REDIS}} = require('../enums');
const chalk =require('chalk');

let redisClient;
let _configs;

/**
 * Set key value pair to cache
 * @param args
 * @return {Promise.<void>}
 */
const set = async (...args) => {
  try {
    const asyncSet = promisify(redisClient.set).bind(redisClient);
    return await asyncSet(...args);
  } catch (e) {
    return undefined;
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

/**
 * Configs setter.
 * @param {object} configs - Parsony configs
 */
const setConfigs = configs => (_configs = configs);

/**
 * Start Redis Caching using optional connection params
 */
const startCache = () =>{
  const options = _configs[REDIS] ||
    {
      host: '127.0.0.1',
      port: 6379,
      path: null,
      url: null
    };
  redisClient = require("redis").createClient(options);
  redisClient.on("error", function(e) {
    switch(e.code){
      case'ECONNREFUSED':
        console.error(chalk.red(`WARNING! Redis Error: ${e.message}`));
        break;
      default:
        throw new Error('Redis Error: ', e.message)
    }
  });
};

/**
 * Ensures singleton access to cache instance
 */
const getCache = () =>{
  return {
    set,
    get,
    del,
    flushAll,
  }
};

module.exports = {
  set,
  get,
  del,
  flushAll,
  setConfigs,
  startCache,
  getCache
};
