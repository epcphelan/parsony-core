/**
 * JSON Gate
 * @module /api/gates/json
 */

const {
  sendFailure,
  makeStandardError
} = require('../../http');

const {
  REQUEST : {
    MALFORMED_JSON : MALFORMED
  }
} = require('../../errors/errors.json');


/**
 * Handles possibly malformed API request
 * @param app - Express app
 */
const JSONGate = app => {
  app.use(function (error, req, res, next) {
    if (error instanceof SyntaxError) {
      sendFailure(res, makeStandardError(MALFORMED));
    }
    else {
      next();
    }
  });
  return app;
};

module.exports = {
  JSONGate
};