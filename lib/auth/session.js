/**
 * Auth Module
 * @module /auth/session
 */
const crypto = require('crypto');
const cache = require("../cache").getCache();
const { randomString } = require("../utils");
const { makeStandardError } = require("../http");
const {
  INVALID_CREDENTIALS,
  SERVER_ERROR,
  SESSION
} = require("../errors/errors.json");
const models = require("../models").getModels();

const cachePrefix = "sessionToken:";



/**
 * Checks provided credentials. Throws HTTP Error Obj if not, otherwise
 * returns null;
 * @param {string} username
 * @param {string} password
 * @return {Promise.<int>}
 */
const checkCredentials = async (username, password) => {
  const { User } = models;
  const user = await User.find({
    where: { username },
    include: [models.UserAuth]
  });
  if (user) {
    let equality = null;
    try {
      equality = _hashEquality(password,user.UserAuth.passwordHash, user.UserAuth.salt)
    } catch (err) {
      throw makeStandardError(SERVER_ERROR, err.message);
    }
    if (equality) {
      return user.id;
    } else {
      throw makeStandardError(INVALID_CREDENTIALS);
    }
  } else {
    throw makeStandardError(INVALID_CREDENTIALS);
  }
};

function _hashEquality(value, hash, salt){
  return _saltedHash(value,salt) === hash;
}

function _saltedHash(string, salt){
  const hash = crypto.createHmac('sha256',salt);
  hash.update(string);
  return hash.digest('hex');
}

/**
 * Gets the session object for a session token. Returns if in cache,
 * otherwise if in DB. Stores to cached if found.
 * @param sessionToken
 * @return {Promise.<object>}
 */
const getSession = async sessionToken => {
  const cachedSession = await _cacheHasSession(sessionToken);
  if (cachedSession) {
    return cachedSession;
  }
  const dbSession = await _dbHasSession(sessionToken);
  if (dbSession) {
    await _cacheSession(
      dbSession.UserId,
      dbSession.sessionToken,
      dbSession.sessionStart
    );
    return dbSession;
  } else {
    throw makeStandardError(SESSION.INVALID);
  }
};

/**
 * Creates and stores new session to DB and cache
 * @param userId
 * @return {Promise.<*>}
 */
const createSession = async userId => {
  const sessionToken = randomString(40);
  const dbSession = await _storeSessionInDB(userId, sessionToken);
  if (dbSession) {
    const cachedSession = await _cacheSession(
      userId,
      dbSession.sessionToken,
      dbSession.sessionStart
    );
    return cachedSession || dbSession;
  } else {
    throw makeStandardError(SESSION.CREATION_ERROR);
  }
};

/**
 * Extends session object with additional optional key value pairs
 * @param sessionToken
 * @param options
 * @return {Promise.<void>}
 */
const extendSession = async (sessionToken, options) =>{
  await _extendSessionInCache(sessionToken, options);
  await _extendSessionInDB(sessionToken,options);
};

/**
 * Destroys session in DB and in cache
 * @param sessionToken
 * @return {Promise.<null>}
 */
const destroySession = async sessionToken => {
  await Promise.all([
    _deleteSessionFromDB(sessionToken),
    _flushSessionFromCache(sessionToken)
  ]);
  return null;
};


async function _dbHasSession(sessionToken) {
  const { User, UserSessions } = models;
  const session = await UserSessions.find({
    where: {
      sessionToken
    },
    include: [User]
  });
  return session
    ? Object.assign({},{
      userId: session.UserId,
      sessionToken: session.sessionToken,
      sessionStart: session.sessionStart
    },JSON.parse(session.options))
    : false;
}

async function _cacheHasSession(sessionToken) {
  const cacheToken = cachePrefix + sessionToken;
  const token = await cache.get(cacheToken);
  return token ? JSON.parse(token) : false;
}

async function _cacheSession(userId, sessionToken, sessionStart) {
  const cacheToken = cachePrefix + sessionToken;
  const sessionObj = {
    userId,
    sessionStart,
    sessionToken
  };
  await cache.set(cacheToken, JSON.stringify(sessionObj));
}

async function _extendSessionInCache(sessionToken, options) {
  const cacheToken = cachePrefix + sessionToken;
  const session = await cache.get(cacheToken);
  if(session){
    const sessionObj = JSON.parse(session);
    const extendedSessionObj = Object.assign({}, sessionObj, options);
    await cache.set(cacheToken, JSON.stringify(extendedSessionObj));
  }
}

async function _extendSessionInDB( sessionToken, options){
  const { UserSessions } = models;
  try {
    await UserSessions.update(
      {
        options:JSON.stringify(options)
      },
      {
        where: {
          sessionToken
        }
      });
  } catch (err) {
    throw makeStandardError(SESSION.DB_WRITE_ERROR);
  }
}

async function _storeSessionInDB(userId, sessionToken) {
  const { UserSessions } = models;
  try {
    const session = await UserSessions.create({
      UserId: userId,
      sessionToken,
      sessionStart: new Date()
    });
    return {
      userId,
      sessionToken,
      sessionStart: session.sessionStart
    };
  } catch (err) {
    throw makeStandardError(SESSION.DB_WRITE_ERROR);
  }
}

async function _flushSessionFromCache(sessionToken) {
  const cacheToken = cachePrefix + sessionToken;
  try {
    await cache.del(cacheToken);
  } catch (err) {
    throw makeStandardError(SESSION.FLUSH_CACHE_ERROR);
  }
}

async function _deleteSessionFromDB(sessionToken) {
  const { UserSessions } = models;
  const session = await UserSessions.find({
    where: {
      sessionToken
    }
  });
  if (session) await session.destroy();
}
module.exports = {
  checkCredentials,
  getSession,
  createSession,
  destroySession,
  extendSession
};
