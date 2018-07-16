/**
 * Parsony root
 * @module /parsony
 */
const path = require("path");
const express = require("express");
const body_parser = require("body-parser");
const fs = require("fs");
const chalk = require("chalk");
const figlet = require("figlet");
const clear = require("clear");

const { dateTime } = require("./lib/utils");
const db = require("./lib/db");
const http = require("./lib/http");
const models = require("./lib/models");
const email = require("./lib/email");
const sms = require("./lib/sms");
const api = require("./lib/api");
const auth = require("./lib/auth");
const utils = require("./lib/utils");
const services = require("./lib/services/services");
const cache = require("./lib/cache");
const errors = require("./lib/errors/errors.json");
const EXIT = require("./lib/errors/startupExitMessages");

const {
  CONFIG: { API_DEBUG, HTTP_PORT, API_ENDPOINT, LOGGING },
  SETTINGS: {
    DIRS,
    MODELS,
    SERVICES,
    WWW,
    SCHEDULED,
    TEMPLATES,
    FILES,
    CONFIGS,
    _404
  }
} = require("./lib/enums");

const {
  setScheduledDirectory,
  createScheduledTasks,
  start
} = require("./lib/scheduled");

const ENV_VARS = {
  PARSONY_ENV: "PARSONY_ENV",
  API_DEBUG: "API_DEBUG",
  DROP_DB: "DROP_DB",
  API_LOGGING: "API_LOGGING",
  LOCAL: "local"
};

const DEFAULT_CONFIGS = {
  local: {
    api_endpoint: "json-api",
    http_port: 8070,
    logging: false,
    api_debug: false
  }
};

const DEFAULT_404 = "./static/404.html";
const parsony = {};
let instantiated = false;
let pFile;
let app;

const init = settings => {
  try {
    _init(settings);
  } catch (err) {
    throw new Error(`${EXIT.INIT_FAIL}${err.toString()}`);
  }
};

function _init(settings) {
  const configs = _configsFromSettings(settings);
  const _404 = _404FromSettings(settings);
  _setResources(configs);
  _bindApp();
  _bindMiddlewares();
  _add404(_404);
  _attachDirectoriesWith(settings);
  _projectFile();
}

function _configsFromSettings(settings) {
  if (settings.hasOwnProperty(FILES)) {
    if (settings[FILES].hasOwnProperty(CONFIGS)) {
      const configsFile = require(settings[FILES][CONFIGS]);
      return Object.assign({}, DEFAULT_CONFIGS, configsFile);
    } else {
      throw new Error(EXIT.MISSING_CONFIGS);
    }
  } else {
    throw new Error(EXIT.MISSING_FILES);
  }
}

function _404FromSettings(settings) {
  if (settings.hasOwnProperty(FILES) && settings[FILES].hasOwnProperty(_404)) {
    return settings[FILES][_404];
  } else {
    return DEFAULT_404;
  }
}

function _bindApp() {
  app = express();
}

function _bindMiddlewares() {
  app.use(body_parser.json());
  if (_loggingEnabled() === true) {
    const { log } = utils;
    log(app);
  }
}

function _loggingEnabled() {
  const { API_LOGGING } = ENV_VARS;
  return process.env[API_LOGGING] || parsony.configs[LOGGING];
}

function _add404(pathTo404) {
  parsony.pathTo404 = pathTo404;
}

function _setResources(conf) {
  _setParsonyRootDir();
  _setParsonyEnvVars();
  _setParsonyConfigs(conf);
  _setDebugMode();
  _addParsonyToModules();
  _setModuleConfigs();
}

function _setParsonyRootDir() {
  parsony.root = __dirname;
}

function _setParsonyConfigs(conf) {
  const { env } = parsony;
  /*istanbul ignore next */
  if (conf.hasOwnProperty(env)) {
    parsony.configs = conf[env];
  } else {
    throw new Error(`${EXIT.INVALID_ENV}${env}`);
  }
}

function _setParsonyEnvVars() {
  const { PARSONY_ENV, LOCAL, DROP_DB } = ENV_VARS;
  parsony.env = process.env[PARSONY_ENV] || LOCAL;
  parsony.dropDB = process.env[DROP_DB] || false;
}

function _setDebugMode() {
  parsony.debugMode = process.env[API_DEBUG]
    || parsony.configs[API_DEBUG]
    || false;
}

function _setModuleConfigs() {
  const { configs } = parsony;
  const { setConfigs: emailConfigs } = email;
  const { setConfigs: smsConfigs } = sms;
  const { setConfigs: cacheConfigs } = cache;
  emailConfigs(configs);
  smsConfigs(configs);
  cacheConfigs(configs);
}

function _addParsonyToModules() {
  const { setParsony: dbParsony } = db;
  const { setParsony: emailParsony } = email;
  const { setParsony: smsParsony } = sms;
  dbParsony(parsony);
  emailParsony(parsony);
  smsParsony(parsony);
}

function _attachDirectoriesWith(settings) {
  _validateSettings(settings);
  const dirs = settings[DIRS];
  _mkDirs(dirs);
  _attachModels(dirs[MODELS]);
  _attachServices(dirs[SERVICES]);
  _setStaticDir(dirs[WWW]);
  if (dirs.hasOwnProperty(SCHEDULED)) {
    _attachScheduledProcesses(dirs[SCHEDULED]);
  }
  if (dirs.hasOwnProperty(TEMPLATES)) {
    _attachTemplatesDir(dirs[TEMPLATES]);
  }
}

function _projectFile() {
  const p = path.join(process.cwd(), ".parsony.json");
  if (!fs.existsSync(p)) {
    const pUtilPath = path.join(__dirname, "lib", "utils", ".parsony.json");
    const pUtil = fs.readFileSync(pUtilPath);
    fs.writeFileSync(p, pUtil);
  }
  pFile = require(p);
}

function _mkDirs(dirs) {
  for (let key in dirs) {
    if (dirs.hasOwnProperty(key)) {
      if (!fs.existsSync(dirs[key])) {
        fs.mkdirSync(dirs[key]);
      }
    }
  }
}

function _validateSettings(settings) {
  if (!settings.hasOwnProperty(DIRS)) {
    throw new Error(EXIT.MISSING_DIRS);
  } else {
    const dirs = settings[DIRS];
    if (!dirs.hasOwnProperty(MODELS)) {
      throw new Error(EXIT.MISSING_MODELS);
    }
    if (!dirs.hasOwnProperty(SERVICES)) {
      throw new Error(EXIT.MISSING_SERVICES);
    }
    if (!dirs.hasOwnProperty(WWW)) {
      throw new Error(EXIT.MISSING_WWW);
    }
  }
}

function _attachModels(directory) {
  models.setConfigs(parsony.configs);
  models.setModelsDirectory(directory);
  models.start();
  parsony.models = models.core;
}

function _attachServices(directory) {
  services.setServicesDirectory(directory);
  services.setConfigs(parsony.configs);
  services.setDebugMode(parsony.debugMode);
  services.setApp(app);
}

function _setStaticDir(dir) {
  app.use(express.static(dir, { extensions: ["html"] }));
}

function _attachScheduledProcesses(directory) {
  setScheduledDirectory(directory);
}

function _attachTemplatesDir(directory) {
  const { setTemplates } = email;
  setTemplates(directory);
}

async function _startupSequence() {
  clear();
  console.log(_startupStartStmt());

  _startCache();
  console.log(`\u272A  Cache server started...`);

  _setDBPool();
  console.log(`\u272A  Database Pool instantiated...`);

  const conn = await _getDBConnection();
  console.log(`\u272A  Successfully connected to database...`);

  services.start();
  console.log(`\u272A  API Services configured and attached to routes...`);

  _bind404toApp();
  console.log(`\u272A  Path to static 404 HTML page set...`);

  await _disableDBForeignKeyChecks(conn);
  console.log(`\u272A  Database Foreign Key Checks disabled...`);

  await _synchronizeModels();
  console.log(`\u272A  Models synchronized`);

  await _enableDBForeignKeyChecks(conn);
  console.log(`\u272A  Database Foreign Key Checks restored...`);

  const scheduled = _startScheduledServices();
  console.log(_scheduledServicesLogStmt(scheduled));

  _startAppListening();
  console.log(_startupLogStmt());

  const keyPair = await _genInitialKeyPair();
  if (keyPair) {
    console.log(_keyPairStmt(keyPair));
  }

  _setIsInstantiated(true);
  console.log(_startupSuccessStmt());

  _updateInstalled();
  return app;
}

function _startCache() {
  cache.startCache();
}

function _setDBPool() {
  const { createPool } = db;
  parsony.dbPool = createPool(parsony.configs.db);
}

/* istanbul ignore next*/
function _getDBConnection() {
  const { dbPool } = parsony;
  return new Promise((resolve, reject) => {
    dbPool.getConnection(function(err, conn) {
      if (err) {
        reject(new Error(`${EXIT.DB_FAIL}${err.toString()}`));
      } else {
        resolve(conn);
      }
    });
  });
}

function _bind404toApp() {
  app.use(function(req, res) {
    res.status(404);
    res.sendFile(parsony.pathTo404);
  });
}

function _disableDBForeignKeyChecks(conn) {
  return new Promise((resolve, reject) => {
    try {
      conn.query("SET FOREIGN_KEY_CHECKS = 0", resolve);
    } catch (e) {
      reject(e);
    }
  });
}

async function _synchronizeModels() {
  return await parsony.models.sequelize.sync({ force: parsony.dropDB });
}

function _enableDBForeignKeyChecks(conn) {
  return new Promise((resolve, reject) => {
    try {
      conn.query("SET FOREIGN_KEY_CHECKS = 1", resolve);
    } catch (e) {
      reject(e);
    }
  });
}

function _updateInstalled() {
  if (!pFile.installed) {
    pFile.installed = true;
    _writePFile();
  }
}

function _startScheduledServices() {
  const { created } = createScheduledTasks();
  const started = start();
  return {
    created,
    started
  };
}

function _startAppListening() {
  app.listen(parsony.configs[HTTP_PORT]);
}

async function _genInitialKeyPair() {
  if (parsony.dropDB || !pFile.installed) {
    const keyPair = await auth.createAPIKeyPair();
    _saveInitialKeyPair(keyPair);
    return keyPair;
  }
}

function _writePFile() {
  if (pFile) {
    const save = path.join(process.cwd(), ".parsony.json");
    fs.writeFileSync(save, JSON.stringify(pFile, null, 2));
  }
}

function _saveInitialKeyPair(pair) {
  if (pFile) {
    pFile.init = pair;
    _writePFile();
  }
}

function _keyPairStmt({ key, secret }) {
  return `\n\u272A  Generated initial Key Pair:
  | Key:      ${key}
  | Secret:   ${secret} `;
}

function _startupLogStmt() {
  const port = parsony.configs[HTTP_PORT];
  const endpoint = parsony.configs[API_ENDPOINT];
  const timestamp = dateTime();
  return `\n\u272A  HTTP Server started:
  | Listening on port: ${port} @ ${timestamp}.
  | API endpoint is : /${endpoint}
  | Logging is ${_loggingEnabled() ? "ENABLED" : "DISABLED"}`;
}

function _scheduledServicesLogStmt({ created, started }) {
  return `\n\u272A  Scheduled services processed: 
  | [${created}] created...
  | [${started}] running...`;
}

function _startupStartStmt() {
  return `
  
  ${chalk.yellow(figlet.textSync("Parsony", { horizontalLayout: "full" }))}

 ****************************************************
 ******************* STARTING UP ********************

  `;
}

function _startupSuccessStmt() {
  return `

 ***************** PARSONY IS LIVE ******************
 ****************************************************
  `;
}
function _setIsInstantiated(bool) {
  instantiated = bool;
}

const getBundle = () => {
  return {
    env: parsony.env,
    models: parsony.models,
    debugMode: parsony.debugMode,
    configs: parsony.configs,
    dbPool: parsony.dbPool,
    db,
    services,
    http,
    auth,
    utils,
    email,
    sms,
    app,
    api,
    errors
  };
};

module.exports = {
  init,
  start: _startupSequence,
  isLive: () => instantiated,
  getBundle
};
