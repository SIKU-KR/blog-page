import { z } from 'zod';

export const PostSummaryContractSchema = z.object({
  id: z.number(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  state: z.enum(['draft', 'published']).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PostListContractSchema = z.object({
  content: z.array(PostSummaryContractSchema),
  totalElements: z.number(),
  pageNumber: z.number(),
  pageSize: z.number(),
});

export const AdminPostSummaryContractSchema = z.object({
  id: z.number(),
  slug: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  state: z.enum(['draft', 'published', 'scheduled']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AdminPostsContractSchema = z.object({
  content: z.array(AdminPostSummaryContractSchema),
  totalElements: z.number(),
  pageNumber: z.number(),
  pageSize: z.number(),
});

export type PostSummaryContract = z.infer<typeof PostSummaryContractSchema>;
export type PostListContract = z.infer<typeof PostListContractSchema>;
export type AdminPostSummaryContract = z.infer<typeof AdminPostSummaryContractSchema>;
export type AdminPostsContract = z.infer<typeof AdminPostsContractSchema>;
