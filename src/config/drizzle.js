const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const * as schema from '../models/schema';
require('dotenv').config();

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Create Drizzle instance
const db = drizzle(pool, { schema });

// Health check function
const checkConnection = async () => {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
const closeConnection = async () => {
  await pool.end();
};

module.exports = {
  db,
  pool,
  checkConnection,
  closeConnection,
};