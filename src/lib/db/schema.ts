/**
 * Drizzle ORM Schema Definitions
 * PostgreSQL + pgvector for Supabase
 */
import {
  pgTable,
  bigserial,
  varchar,
  text,
  integer,
  timestamp,
  uuid,
  primaryKey,
  index,
  uniqueIndex,
  bigint,
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
    views: integer('views').notNull().default(0),
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

export const tags = pgTable('tags', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  postCount: integer('post_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const postTags = pgTable(
  'post_tags',
  {
    postId: bigint('post_id', { mode: 'number' })
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    tagId: bigint('tag_id', { mode: 'number' })
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  table => ({
    pk: primaryKey({ columns: [table.postId, table.tagId] }),
    postIdIdx: index('idx_post_tags_post_id').on(table.postId),
    tagIdIdx: index('idx_post_tags_tag_id').on(table.tagId),
  })
);

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: bigint('post_id', { mode: 'number' })
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    authorName: varchar('author_name', { length: 100 }).notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => ({
    postIdIdx: index('idx_comments_post_id').on(table.postId),
  })
);

// Relations
export const postsRelations = relations(posts, ({ many, one }) => ({
  postTags: many(postTags),
  comments: many(comments),
  originalPost: one(posts, {
    fields: [posts.originalPostId],
    references: [posts.id],
  }),
  translations: many(posts, { relationName: 'translations' }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id],
  }),
  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
}));

// Type exports (defined in types.ts, re-exported for backwards compatibility)
export type { Post, NewPost, Tag, NewTag, PostTag, NewPostTag, Comment, NewComment } from './types';
