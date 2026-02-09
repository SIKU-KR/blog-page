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
  bigint,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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
    locale: varchar('locale', { length: 5 }).notNull().default('ko'),
    originalPostId: bigint('original_post_id', { mode: 'number' }),
    // embedding is vector(1536) - handled via raw SQL
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => ({
    slugLocaleIdx: uniqueIndex('idx_posts_slug_locale').on(table.slug, table.locale),
    stateIdx: index('idx_posts_state').on(table.state),
    localeIdx: index('idx_posts_locale').on(table.locale),
    createdAtIdx: index('idx_posts_created_at').on(table.createdAt),
    originalPostIdIdx: index('idx_posts_original_post_id').on(table.originalPostId),
  })
);

// Relations
export const postsRelations = relations(posts, ({ one, many }) => ({
  originalPost: one(posts, {
    fields: [posts.originalPostId],
    references: [posts.id],
  }),
  translations: many(posts, { relationName: 'translations' }),
}));

// Type exports (defined in types.ts, re-exported for backwards compatibility)
export type { Post, NewPost } from './types';
