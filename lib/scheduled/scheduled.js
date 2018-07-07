/**
 * Scheduler Module
 * @module /scheduled/scheduled
 */

const fs = require("fs");
const cron = require("node-cron");
const { join } = require("path");

let jobsDir,
  tasks = [],
  startedTasks,
  stoppedTasks;

/**
 * Scheduled Jobs dir setter.
 * @param {string} dir - path to scheduled jobs
 */
const setScheduledDirectory = dir =>
  (jobsDir = dir);

/**
 * Scheduled Jobs directory getter.
 */
const getScheduledDirectory = () => jobsDir;

/**
 * Generates scheduled tasks with node-cron.
 * @return {{created: Number, executed: number, failed: number}}
 */
const createScheduledTasks = () => {
  startedTasks = 0;
  stoppedTasks = 0;
  let failed = 0,
    executed = 0;
  fs.readdirSync(jobsDir)
    .filter(function(file) {
      return file.indexOf(".") !== 0;
    })
    .forEach(function(file) {
      const scheduledTask = require(join(jobsDir, file));
      const { schedule, execute, runOnStartUp } = scheduledTask;
      try {
        const task = cron.schedule(schedule, execute, false);
        tasks.push(task);
      } catch (e) {
        failed ++;
      }
      // if runOnStart == true, execute task on parsony start.
      if (runOnStartUp === true) {
        execute();
        executed ++;
      }
    });
  return {
    created: tasks.length,
    executed,
    failed
  };
};

/**
 * Start all cron jobs
 * @return {int} - count of started jobs
 */
const start = () => {
  tasks.forEach(task => {
    task.start();
    startedTasks ++;
  });
  return startedTasks;
};

/**
 * Stop all cron jobs
 * @return {int} - count of stopped jobs
 */
const stop = () => {
  tasks.forEach(task => {
    task.stop();
    stoppedTasks ++;
  });
  return stoppedTasks;
};

module.exports = {
  start,
  stop,
  createScheduledTasks,
  getScheduledDirectory,
  setScheduledDirectory
};
