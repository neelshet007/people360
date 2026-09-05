const routes = require('./routes');
const concernService = require('./services/concernService');
const concernRepository = require('./repositories/concernRepository');

module.exports = {
  routes,
  services: concernService,
  repositories: concernRepository,
};
