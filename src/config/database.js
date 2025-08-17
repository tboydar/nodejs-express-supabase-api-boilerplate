// Legacy database connection (for raw SQL queries if needed)
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const query = (text, params) => pool.query(text, params);

const getClient = async () => {
  const client = await pool.connect();
  return client;
};

// Export legacy connection for backwards compatibility
module.exports = {
  pool,
  query,
  getClient,
};

// For new code, prefer using Drizzle from './drizzle.js'