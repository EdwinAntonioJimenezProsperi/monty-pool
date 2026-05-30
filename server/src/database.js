const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Falta la variable de entorno DATABASE_URL (cadena de conexión de Postgres).');
  throw new Error('DATABASE_URL no está configurada');
}

// SSL: requerido por proveedores como Neon/Supabase; se desactiva para Postgres local.
const isLocal = /@(localhost|127\.0\.0\.1)/.test(connectionString);
const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

// Permite seguir escribiendo los queries con '?' (estilo SQLite) y los
// convierte a los marcadores posicionales de Postgres ($1, $2, ...).
function toPg(text) {
  let i = 0;
  return text.replace(/\?/g, () => `$${++i}`);
}

async function all(text, params = []) {
  const result = await pool.query(toPg(text), params);
  return result.rows;
}

async function get(text, params = []) {
  const result = await pool.query(toPg(text), params);
  return result.rows[0];
}

async function run(text, params = []) {
  return pool.query(toPg(text), params);
}

// Transacción: la función recibe un objeto con get/all/run ligados al mismo cliente.
async function withTransaction(fn) {
  const client = await pool.connect();
  const q = {
    get: async (t, p = []) => (await client.query(toPg(t), p)).rows[0],
    all: async (t, p = []) => (await client.query(toPg(t), p)).rows,
    run: async (t, p = []) => client.query(toPg(t), p)
  };
  try {
    await client.query('BEGIN');
    const result = await fn(q);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'encargado')),
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      active INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS tables_config (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      price_per_hour DOUBLE PRECISION NOT NULL DEFAULT 20,
      price_per_half_hour DOUBLE PRECISION NOT NULL DEFAULT 10,
      status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied')),
      started_at TIMESTAMPTZ,
      current_session_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS table_sessions (
      id SERIAL PRIMARY KEY,
      table_id INTEGER NOT NULL REFERENCES tables_config(id),
      started_at TIMESTAMPTZ NOT NULL,
      ended_at TIMESTAMPTZ,
      duration_minutes DOUBLE PRECISION,
      total DOUBLE PRECISION,
      user_id INTEGER REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sales (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      unit_price DOUBLE PRECISION NOT NULL,
      total DOUBLE PRECISION NOT NULL,
      user_id INTEGER REFERENCES users(id),
      table_id INTEGER REFERENCES tables_config(id),
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { pool, all, get, run, withTransaction, init, asyncHandler };
