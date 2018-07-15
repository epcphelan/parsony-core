/**
 * API Module
 * @module /api
 */

const utils = require("../utils");
const auth = require("../auth");
const cache = require("../cache");
const { sendSuccess, sendFailure, makeStandardError } = require("../http");
const {
  JSONGate,
  endpointValidationGateAsync,
  apiKeyGateAsync,
  sessionAuthenticationGateAsync,
  signedRequestGate
} = require("./gates");
const errors = require("../errors/errors.json");
const {
  INTERFACE: {
    JSON_API,
    METHOD: INTERFACE_METHOD,
    REST_URL,
    HANDLER,
    PARAMS,
    AUTHENTICATION,
    SESSION_TOKEN,
    API_KEY
  },
  REQUEST: { METHOD: REQUEST_METHOD, ARGS, HINT },
  RESPONSE: { API_EXPECTS }
} = require("../enums");
const HTTP = {
  GET: "get",
  POST: "post",
  PUT: "put",
  DELETE: "delete"
};
const ABORT = {
  METHOD: {
    NOT_FOUND: "noMethodFound",
    NOT_SUPPLIED: "noMethodSupplied"
  },
  ARGS: {
    MISSING: "noArgsSupplied"
  }
};

/**
 * Combines all service interfaces into master object.
 * @param master - Object combining all service interfaces.
 * @param service - Service interface
 * @return {object}
 */
const combineInterfaceContracts = (master, service) => {
  const contracts = service.interface || [];
  const combined = Object.assign({}, master);
  contracts.forEach(endpoint => {
    combined.contracts[endpoint[JSON_API]] = endpoint;
    combined.mappings[endpoint[JSON_API]] = endpoint[JSON_API];
  });
  return combined;
};

/**
 * Binds REST endpoints for a service to the Express App using the
 * RESTUrl key of the contract.
 *
 * Express uses the HTTP method described in the service contracts.
 *
 * @param app - Express application
 * @param service - service object
 */
const bindRESTEndpointsToRoutes = (app, service) => {
  const contracts = service.interface || [];

  contracts.forEach(contract => {
    const method = contract[INTERFACE_METHOD];
    const url = contract[REST_URL];

    if (method && url) {
      switch (method) {
        case HTTP.GET:
          app.get(url, (req, res) => {
            _restfulReq(req, res, contract);
          });
          break;

        case HTTP.POST:
          app.post(url, (req, res) => {
            _restfulReq(req, res, contract);
          });
          break;

        case HTTP.PUT:
          app.put(url, (req, res) => {
            _restfulReq(req, res, contract);
          });
          break;

        case HTTP.DELETE:
          app.delete(url, (req, res) => {
            _restfulReq(req, res, contract);
          });
          break;
      }
    }
  });
  return app;
};

/**
 * Process an API request to RESTful endpoint.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param contract - Endpoint Interface contract
 * @private
 */
function _restfulReq(req, res, contract) {
  const method = req.route.path;
  const args = req.body;

  _validateThenHandle(req, res, args, method, contract);
}

/**
 * Binds NOT_JSON RPC methods for a service to the Express App using
 * the method key of the contract.
 *
 * All POST requests to NOT_JSON RPC endpoint are routed to the same
 * method which routes to the proper handler.
 *
 * @param app - Express application
 * @param master - Object combining all service interfaces.
 * @param apiEndpoint - POST endpoint for NOT_JSON RPC
 * @param debugMode - boolean: request for hint return a contract
 */
const bindJsonRpcToPostEndpoint = (app, master, apiEndpoint, debugMode) => {
  //binds all of the mappings and contracts to a single router endpoint
  const contracts = master.contracts;
  const jsonAPIMap = master.mappings;
  const api = `/${apiEndpoint}`;
  const {
    METHOD: { NOT_SUPPLIED, NOT_FOUND },
    ARGS: { MISSING }
  } = ABORT;

  app.post(api, (req, res) => {
    const reqMethod = req.body[REQUEST_METHOD];

    if (!reqMethod) {
      _abortWithError(res, req, NOT_SUPPLIED);
    } else if (!jsonAPIMap[reqMethod]) {
      _abortWithError(res, req, NOT_FOUND, reqMethod);
    } else if (req.body[ARGS]) {
      _rpcReq(req, res, contracts[reqMethod]);
    } else if (req.body[HINT] && debugMode) {
      _sendDebugHint(res, contracts[reqMethod]);
    } else {
      _abortWithError(res, req, MISSING);
    }
  });
};

/**
 * Send response with error object.
 *
 * @param res - Express response object
 * @param req - Express request object
 * @param type - error type ENUM
 * @param detail - optional detailed message
 * @private
 */
function _abortWithError(res, req, type, detail) {
  const {
    METHOD: { NOT_FOUND, NOT_SUPPLIED },
    ARGS: { MISSING }
  } = ABORT;

  switch (type) {
    case NOT_FOUND:
      sendFailure(
        res,
        makeStandardError(
          errors.REQUEST.NO_METHOD_FOUND,
          `The requested method: ${detail} was not found.`
        ),
        req.body
      );
      break;

    case NOT_SUPPLIED:
      sendFailure(
        res,
        makeStandardError(errors.REQUEST.NO_METHOD_SUPPLIED),
        req.body
      );
      break;

    case MISSING:
      sendFailure(res, makeStandardError(errors.REQUEST.NO_ARGS), req.body);
      break;
  }
}

/**
 * Process an API request to NOT_JSON RPC endpoint.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param contract - Endpoint Interface contract
 * @private
 */
function _rpcReq(req, res, contract) {
  const method = req.body[REQUEST_METHOD];
  const args = req.body[ARGS];

  _validateThenHandle(req, res, args, method, contract);
}

/**
 * Applies validation rules and passes data, session information to handler
 * or throws validation HTTP Error object.
 *
 *  1. Validate request against parameter validations
 *  2. Pass validated data to handler.
 * @param req
 * @param res
 * @param args
 * @param method
 * @param contract
 * @private
 */

function _validateThenHandle(req, res, args, method, contract) {
  _validateRequest(req, args, contract)
    .then(({ data, sessionObj }) => {
      _handleRequest(contract[HANDLER], sessionObj, data, res, method);
    })
    .catch(err => {
      sendFailure(res, err, req.body);
    });
}

/**
 * Passes data and session object to the stipulated handler, which is always an
 * async function.
 * If handler successfully handles request, send the handlers return {}
 * If handler throws an HTTP Error object, send an http response with the error.
 *
 * @param handler
 * @param sessionObj
 * @param data
 * @param res
 * @param reqMethod
 * @private
 */
function _handleRequest(handler, sessionObj, data, res, reqMethod) {
  handler({ ...data, sessionObj })
    .then(results => {
      sendSuccess(res, results, reqMethod);
    })
    .catch(err => {
      err = err.code
        ? err
        : makeStandardError(errors.SERVER_ERROR, err.message);
      sendFailure(res, err, data, reqMethod);
    });
}

/**
 * Respond to API request with NOT_JSON contract.
 * @param res - Express response object
 * @param contract - NOT_JSON contract object
 * @private
 */
function _sendDebugHint(res, contract) {
  sendSuccess(res, { [API_EXPECTS]: contract });
}

/**
 * Test API request Headers and Body against interface.
 * Each gate tests the request and either returns null or throws
 * and HTTP Error Object.
 *  1. If API Key required, must pass API gate.
 *  2. If Session Token required, must pass Session Token gate.
 *  3. Validate against parameter contract
 *  4. Return data and possible session object if authenticated
 *
 * @param req
 * @param data
 * @param contract
 * @returns {Promise.<{data: *, sessionObj: *}>}
 * @private
 */
async function _validateRequest(req, data, contract) {
  let sessionObj;
  if (isApiKeyRequired(contract)) {
    await apiKeyGateAsync(req);
    await signedRequestGate(req, data);
  }
  if (isSessionTokenRequired(contract)) {
    sessionObj = await sessionAuthenticationGateAsync(req);
  }
  await endpointValidationGateAsync(data, contract[PARAMS]);
  return {
    data,
    sessionObj
  };
}

/**
 * Does the contract require an API Key
 * @param contract
 * @returns {bool}
 */
function isApiKeyRequired(contract) {
  return contract[AUTHENTICATION] && contract[AUTHENTICATION][API_KEY];
}

/**
 * Does the contract require a Session Token
 * @param contract
 * @returns {bool}
 */
function isSessionTokenRequired(contract) {
  return contract[AUTHENTICATION] && contract[AUTHENTICATION][SESSION_TOKEN];
}

module.exports = {
  apiKeyGate: apiKeyGateAsync,
  sessionTokenGate: sessionAuthenticationGateAsync,
  JSONGate,
  combineInterfaceContracts,
  bindRESTEndpointsToRoutes,
  bindJsonRpcToPostEndpoint
};
