/**
 * HTTP Module
 * @module /http/errors
 */

const { SERVER_ERROR, MODEL_ERROR } = require("../errors/errors.json");

/**
 * Make an HTTP Error Object
 * @param {int} errCode - HTTP Error code 4xx,5xx
 * @param {string} type - snake_case_error
 * @param {string} errMsg
 * @param {string} detail
 * @return {Error}
 */
const makeError = (errCode, type, errMsg, detail) => {
  const e = new Error(errMsg);
  e.msg = errMsg;
  e.code = errCode;
  e.type = type;
  e.detail = detail;
  return e;
};

/**
 * Wraps error thrown by Sequelize with HTTP Error
 * @param {Error} err
 * @return {Error}
 */
const modelError = (err) => {
  return makeError(
    MODEL_ERROR.code,
    MODEL_ERROR.type,
    MODEL_ERROR.msg,
    err.message,
  );
};

/**
 * Creates HTTP Error Object with error stub and optional values
 * @param {object} errorObj
 * @param {object} optionalDesc - object or string. Objects will be stringified.
 * @return {Error}
 *
 * @example Error Object
 *   {
 *     "code": 500,
 *     "type": "internal_error",
 *     "msg": "An error has occurred."
 *   }
 */
const makeStandardError = (errorObj, optionalDesc = "") => {
  const newErrorObj = Object.assign({}, SERVER_ERROR, errorObj);
  newErrorObj.detail = optionalDesc || newErrorObj.detail;
  return makeError(
    newErrorObj.code,
    newErrorObj.type,
    newErrorObj.msg,
    newErrorObj.detail,
  );
};

module.exports = {
  makeError,
  modelError,
  makeStandardError,
};
