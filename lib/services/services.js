/**
 * Services Module
 * @module /services/services
 */

const fs = require("fs");
const { join } = require("path");
const { makeStandardError } = require("../http");
const { SERVER_ERROR } = require("../errors/errors");
const { INTERFACE_PROTO } = require("./interfacePrototype.js");
const {
  JSONGate,
  bindJsonRpcToPostEndpoint,
  bindRESTEndpointsToRoutes,
  combineInterfaceContracts
} = require("../api");
const {
  CONFIG: { API_ENDPOINT },
  INTERFACE: { HANDLERS, ENDPOINTS }
} = require("../enums");

const INTERFACE = "interface";

let servicesDir, app, configs, debugMode;

let JSON_MASTER_OBJ = { contracts: {}, mappings: {} };

/**
 * Compile master contract for services and bind to Express
 */
const start = () => {
  app = JSONGate(app);
  _attachServices();
  bindJsonRpcToPostEndpoint(
    app,
    JSON_MASTER_OBJ,
    configs[API_ENDPOINT],
    debugMode
  );
};

function _attachServices() {
  fs.readdirSync(servicesDir)
    .filter(file => {
      return file.indexOf(".") !== 0;
    })
    .forEach(file => {
      const service = file;
      const stats = fs.statSync(join(servicesDir, file));
      /* istanbul ignore else */
      if (stats.isDirectory()) {
        const serviceDir = join(servicesDir, file);
        fs.readdirSync(serviceDir)
          .filter(file => {
            return file.indexOf(INTERFACE) > -1;
          })
          .forEach(file => {
            const contract = require(join(serviceDir, file));
            const handlersPath = contract[HANDLERS];
            const handlers = require(join(serviceDir, handlersPath));
            const endpoints = contract[ENDPOINTS];
            _createServiceWith(endpoints, handlers, service);
          });
      }
    });
}

function _createServiceWith(endpoints, handlers, service) {
  const contract = _bindEndpointsToHandlers(endpoints, handlers);
  const compiled = _combinePartials(contract, service);
  app = bindRESTEndpointsToRoutes(app,compiled);
  JSON_MASTER_OBJ = combineInterfaceContracts(
    JSON_MASTER_OBJ,
    compiled
  );
}

function _bindEndpointsToHandlers(endpoints, handlers) {
  const endpointKeys = Object.keys(endpoints);
  endpointKeys.forEach(key => {
    if (
      endpoints.hasOwnProperty(key) &&
      endpoints[key].handler &&
      handlers[endpoints[key].handler]
    ) {
      endpoints[key].handler = handlers[endpoints[key].handler];
    } else {
      endpoints[key].handler = _defaultHandler();
    }
  });
  return endpoints;
}

function _combinePartials(partials, service) {
  let compiled = [];
  partials.forEach(endpoint => {
    const contract = Object.assign({}, INTERFACE_PROTO, { service }, endpoint);
    compiled.push(contract);
  });
  return { interface: compiled };
}

function _defaultHandler() {
  return async () => {
    throw makeStandardError(SERVER_ERROR);
  };
}

const setServicesDirectory = directory => (servicesDir = directory);

const setConfigs = conf => (configs = conf);

const setDebugMode = debug => (debugMode = debug);

const setApp = expressApp => (app = expressApp);

const getJSONMasterObj = () => JSON_MASTER_OBJ;

module.exports = {
  setConfigs,
  setDebugMode,
  setApp,
  setServicesDirectory,
  getJSONMasterObj,
  start
};
