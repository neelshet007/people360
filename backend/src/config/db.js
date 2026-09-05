const { Pool } = require('pg');
const config = require('./index');

/**
 * PostgreSQL Database Pool Configuration
 * Central database client shared across application modules
 */
const pool = new Pool({
  connectionString: config.databaseUrl,
});

pool.on('error', (err) => {
  console.error('[Database Pool Error]', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
