/**
 * Payroll Module Entry Point
 * Owner: P3 (Payroll)
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
