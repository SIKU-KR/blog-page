import type { posts, tags, postTags, comments } from './schema';

// Select types (for reading from DB)
export type Post = typeof posts.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type PostTag = typeof postTags.$inferSelect;
export type Comment = typeof comments.$inferSelect;

// Insert types (for writing to DB)
export type NewPost = typeof posts.$inferInsert;
export type NewTag = typeof tags.$inferInsert;
export type NewPostTag = typeof postTags.$inferInsert;
export type NewComment = typeof comments.$inferInsert;
