// src/lib/database.ts
import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const poolConfig: PoolConfig = {
  user: process.env.DB_USER || 'autumnusjuris',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'autumnusjuris_db',
  password: process.env.DB_PASSWORD || 'autumnusjuris2024',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Pool de conexões
export const pool = new Pool(poolConfig);

// Evento de erro no pool
pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões PostgreSQL:', err);
  process.exit(-1);
});

// Teste de conexão
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Conexão com PostgreSQL estabelecida:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com PostgreSQL:', error);
    return false;
  }
};

// Query helper com log
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executada', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('❌ Erro na query:', { text, error });
    throw error;
  }
};

// Transação helper
export const transaction = async (callback: (client: any) => Promise<any>) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Graceful shutdown
export const closePool = async () => {
  console.log('🔌 Fechando pool de conexões PostgreSQL...');
  await pool.end();
};

// Graceful shutdown no processo
process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);