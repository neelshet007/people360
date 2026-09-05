/**
 * Contracts Module Entry Point
 * Owner: P1 (Core HR)
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
