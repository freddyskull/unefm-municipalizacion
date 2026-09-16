const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'municipalizacion',
  max: Number(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT) || 5000,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err.message);
});

const query = (text, params) => {
  return new Promise((resolve, reject) => {
    pool.query(text, params, (err, result) => {
      if (err) {
        console.error('Error en query:', err.message);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

module.exports = {
  query,
  pool,
};