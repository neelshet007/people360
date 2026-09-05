const app = require('./app');
const config = require('../config');

const server = app.listen(config.port, () => {
  console.log(`[PeoplePay360] Backend server running on port ${config.port} (${config.env})`);
});

module.exports = server;
