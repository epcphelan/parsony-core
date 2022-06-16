/**
 * MySQL DB Module
 * @module /db/db
 */

const mysql = require("mysql");
const { makeStandardError } = require("../http");
const { DB_ERROR } = require("../errors/errors.json");
const {CONFIG:{
  USERNAME,
  MAX_CONNECTIONS,
  HOST,
  PORT,
  PASSWORD,
  DATABASE,
  LOGGING
}} = require('../enums');

let parsony;

const setParsony = withParsony => (parsony = withParsony);

/**
 * Create new connection pool with props.
 * @param connProps
 * @return {Pool}
 */
const createPool = connProps => {
  const {
    [USERNAME]: user,
    [MAX_CONNECTIONS]: connectionLimit,
    [HOST] :host,
    [PORT]:port,
    [PASSWORD]:password,
    [DATABASE]:database,
    [LOGGING]:logging
  } = connProps;
  const debug = logging ? ["ComQueryPacket"] : [];

  return mysql.createPool({
    host,
    user,
    port,
    password,
    database,
    connectionLimit,
    debug,
    timezone:'Z'
  });
};

/**
 * Execute a mysql statement [insert, update, delete]
 * @param {string} stmt - Executable statement with ?,? placeholder syntax for
 * prepared statements
 * @param {object} args - Array of arguments
 * @return {Promise} - object describing update
 */
const execute = async (stmt, args) => {
  return new Promise((resolve, reject) => {
    parsony.dbPool.getConnection((err, conn) => {
      if (err) {
        conn.release();
        reject(makeStandardError(DB_ERROR, err));
      } else {
        const query = conn.query(stmt, args, (err, results) => {
          if (err) {
            if (parsony.debugMode) {
              err.query_str = query.sql;
            }
            conn.release();
            reject(makeStandardError(DB_ERROR, err));
          } else {
            conn.release();
            resolve(results);
          }
        });
      }
    });
  });
};

/**
 * Perform a MySQL query [select]
 * @param {string} stmt - Query statement with ?,? placeholder syntax for
 * prepared statements
 * @param {object} args - Array of arguments
 * @return {Promise} - returns array with rows and column headers
 */
const query = async (stmt, args) => {
  return new Promise((resolve, reject) => {
    parsony.dbPool.getConnection((err, conn) => {
      if (err) {
        conn.release();
        reject(makeStandardError(DB_ERROR, err));
      } else {
        const query = conn.query(stmt, args, (err, rows, fields) => {
          if (err) {
            if (parsony.debugMode) {
              err.query_str = query.sql;
            }
            conn.release();
            reject(makeStandardError(DB_ERROR, err));
          } else {
            conn.release();
            resolve(rows, fields);
          }
        });
      }
    });
  });
};

module.exports = {
  setParsony,
  createPool,
  execute,
  query
};
