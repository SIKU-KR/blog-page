import { z } from 'zod';

/**
 * Post validation schema with runtime type checking
 * Ensures data integrity at API boundaries
 */
export const PostSchema = z.object({
  id: z.number(),
  slug: z
    .string()
    .min(1, 'Slug는 필수입니다.')
    .regex(/^[a-z0-9가-힣-]+$/, {
      message: 'Slug는 영문 소문자, 숫자, 한글, 하이픈만 포함할 수 있습니다.',
    }),
  title: z.string().min(1, '제목은 필수입니다.'),
  content: z.string().min(1, '내용은 필수입니다.'),
  summary: z.string().min(1, '요약은 필수입니다.'),
  state: z.enum(['draft', 'published']), // Required by new backend
  createdAt: z.string(),
  updatedAt: z.string(),
  canonicalPath: z.string().optional(),
});

/**
 * Post summary schema (for list views)
 */
export const PostSummarySchema = PostSchema.omit({
  content: true,
  canonicalPath: true,
});

/**
 * Create post schema (omit auto-generated fields)
 */
export const CreatePostSchema = PostSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  canonicalPath: true,
});

/**
 * Update post schema (required: title, content, slug, state)
 */
export const UpdatePostSchema = CreatePostSchema.partial().required({
  title: true,
  content: true,
  slug: true,
  state: true,
});

// Type exports
export type Post = z.infer<typeof PostSchema>;
export type PostSummary = z.infer<typeof PostSummarySchema>;
export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;
