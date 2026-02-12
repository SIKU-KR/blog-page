/**
 * Drizzle ORM Schema Definitions
 * PostgreSQL + pgvector for Supabase
 */
import {
  pgTable,
  bigserial,
  varchar,
  text,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// Note: pgvector is handled via raw SQL for embedding column
// Drizzle doesn't have native pgvector support, so we'll use sql`` for vector operations

export const posts = pgTable(
  'posts',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    slug: varchar('slug', { length: 255 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    content: text('content').notNull(),
    summary: varchar('summary', { length: 500 }),
    state: varchar('state', { length: 20 }).notNull().default('draft'),
    // embedding is vector(1536) - handled via raw SQL
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => ({
    slugIdx: uniqueIndex('idx_posts_slug').on(table.slug),
    stateIdx: index('idx_posts_state').on(table.state),
    createdAtIdx: index('idx_posts_created_at').on(table.createdAt),
  })
);

// Type exports (defined in types.ts, re-exported for backwards compatibility)
export type { Post, NewPost } from './types';
