/**
 * HTTP Module
 * @module /http/response
 */

const CONTENT_TYPE_HEADER = { "Content-Type": "application/json" };

/**
 * Send HTTP 200 response with JSON success payload via Express
 * @param {object} res - Express response object
 * @param {object} data - response packet
 * @param {string} requested - requested endpoint/resource
 */
const sendSuccess = (res, data, requested) => {
  const output = {
    requested,
    success: true,
    error: null,
    data
  };
  res.writeHead(200, CONTENT_TYPE_HEADER);
  res.end(JSON.stringify(output));
};

/**
 * Send HTTP 200 response with JSON failed-response payload via Express
 * @param {object} res - Express response object
 * @param {Error} err - HTTP Error Object or caught Error
 * @param {object} packet - request body
 * @param {string} requested - requested endpoint/resource
 * @param {boolean} debug - optional if debug
 */
const sendFailure = (res, err, packet, requested, debug = false) => {
  if (packet) delete packet.sessionObj;
  const { type, msg: message, detail, code } = err;
  const output = {
    requested,
    success: false,
    error: {
      code,
      type,
      message,
      detail
    },
    data: null
  };

  if(debug===true){
    output.data = {
      received: packet
    }
  }
  res.writeHead(200, CONTENT_TYPE_HEADER);
  res.end(JSON.stringify(output));
};

module.exports = {
  sendSuccess,
  sendFailure
};
