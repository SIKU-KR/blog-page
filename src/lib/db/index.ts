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
    const databaseUrl = process.env.DATABASE_URL
      || process.env.POSTGRES_URL_NON_POOLING
      || process.env.POSTGRES_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    connection = postgres(databaseUrl, {
      max: 10, // Maximum pool size
      idle_timeout: 20, // Close idle connections after 20 seconds
      connect_timeout: 10, // Connection timeout in seconds
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
