/**
 * Drizzle ORM Database Client
 * PostgreSQL connection with Supabase
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection singleton
let connection: postgres.Sql | null = null;

function getConnection() {
  if (!connection) {
    // Supabase 연결 우선순위: Transaction pooler(6543) > Session pooler(5432) > Direct
    // Serverless 환경에서는 Transaction 모드를 반드시 사용해야 함
    const databaseUrl =
      process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
    if (!databaseUrl) {
      const msg = 'DATABASE_URL environment variable is not set';
      console.error(`[DB] ${msg}`);
      throw new Error(msg);
    }

    connection = postgres(databaseUrl, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
      onnotice: () => {},
    });

    connection
      .unsafe('SELECT 1')
      .then(() => console.warn('[DB] Connection pool initialized'))
      .catch(err => {
        console.error('[DB] Initial connection check failed:', err.message);
        connection = null;
      });
  }
  return connection;
}

// Create drizzle instance with schema
export const db = drizzle(getConnection(), { schema });

// Export schema for type inference
export * from './schema';

// Export type for database instance
export type Database = typeof db;
