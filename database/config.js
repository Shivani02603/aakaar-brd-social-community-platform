const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const poolConfig = {
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(poolConfig);

let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

async function connectDB() {
  while (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
    try {
      console.log(`Attempting database connection (attempt ${connectionAttempts + 1}/${MAX_CONNECTION_ATTEMPTS})...`);
      const client = await pool.connect();
      console.log('Database connection established successfully');
      client.release();
      return;
    } catch (error) {
      connectionAttempts++;
      if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
        console.error('Failed to connect to database after maximum retry attempts');
        throw error;
      }
      console.warn(`Connection attempt ${connectionAttempts} failed, retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

async function disconnectDB() {
  try {
    console.log('Closing database connection pool...');
    await pool.end();
    console.log('Database connection pool closed successfully');
  } catch (error) {
    console.error('Error closing database connection pool:', error);
    throw error;
  }
}

async function healthCheck() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    client.release();
    return {
      status: 'healthy',
      timestamp: result.rows[0].current_time,
      version: result.rows[0].version,
      message: 'Database connection is healthy'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      message: 'Database connection failed'
    };
  }
}

module.exports = {
  pool,
  connectDB,
  disconnectDB,
  healthCheck
};