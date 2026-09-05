/**
 * Attendance Module Entry Point
 * Owner: P2 (HR Operations)
 */

const routes = require('./routes');
const controllers = require('./controllers');
const services = require('./services');
const validators = require('./validators');

module.exports = {
  routes,
  controllers,
  services,
  validators,
};
