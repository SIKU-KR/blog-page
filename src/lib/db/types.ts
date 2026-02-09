import type { posts } from './schema';

// Select types (for reading from DB)
export type Post = typeof posts.$inferSelect;

// Insert types (for writing to DB)
export type NewPost = typeof posts.$inferInsert;
