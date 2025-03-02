/**
 * Models module
 * @module /models/models
 */

const fs = require("fs");
const { join } = require("path");
const Sequelize = require("sequelize");
const { createNamespace } = require("continuation-local-storage");
const {
  CONFIG: { DB, DATABASE, USERNAME, PASSWORD }
} = require("../enums");

const NAMESPACE = "parsony-namespace";
const ASSOCIATE = "associate";

let modelsDirectory,
  configs,
  sequelize,
  models = {};

/**
 * Instantiate and compile models with Sequelize
 */
const start = () => {
  Sequelize.useCLS(createNamespace(NAMESPACE));
  sequelize = new Sequelize(
    configs[DB][DATABASE],
    configs[DB][USERNAME],
    configs[DB][PASSWORD],
    configs[DB]
  );
  _createAndAttachModels();
};

function _createAndAttachModels() {
  fs.readdirSync(modelsDirectory)
    .filter(file => {
      return file.indexOf(".") !== 0;
    })
    .forEach(file => {
      const model = require(join(modelsDirectory, file))(sequelize, Sequelize.DataTypes);
      models[model.name] = model;
    });
  Object.keys(models).forEach(modelName => {
    const model = models[modelName];
    if (ASSOCIATE in model) {
      model.associate(models);
    }
  });
  module.exports.core = models;
  module.exports.core.sequelize = sequelize;
  module.exports.core.Sequelize = Sequelize;
}

/**
 * Set configs for module
 * @param {object} conf
 */
const setConfigs = conf => (configs = conf);

/**
 * Set models directory
 * @param {string} modelsDir - path to models
 */
const setModelsDirectory = modelsDir => (modelsDirectory = modelsDir);

/**
 * Getter for all models object
 * @return {object}
 */
const getModels = () => models;

module.exports = {
  getModels,
  start,
  setModelsDirectory,
  setConfigs
};
