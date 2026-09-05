const { Pool } = require('pg');
const config = require('../config');

/**
 * PostgreSQL Database Connection Manager
 * Owner: P1 (Core HR)
 */

let pool = null;
let isConnected = false;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl || 'postgresql://postgres:password@localhost:5432/peoplepay360',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
    });

    pool.on('error', (err) => {
      console.error('[PostgreSQL Pool Error]:', err.message);
    });
  }
  return pool;
}

const db = {
  query: async (text, params) => {
    const p = getPool();
    return p.query(text, params);
  },

  getClient: async () => {
    const p = getPool();
    return p.connect();
  },

  testConnection: async () => {
    try {
      const p = getPool();
      const res = await p.query('SELECT 1 as connected');
      isConnected = true;
      return true;
    } catch (err) {
      isConnected = false;
      return false;
    }
  },

  isDbConnected: () => isConnected,
};

module.exports = db;
