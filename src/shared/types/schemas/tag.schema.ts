import { z } from 'zod';

/**
 * Tag schema for runtime validation
 */
export const TagSchema = z.object({
  id: z.number(),
  name: z.string().min(1, '태그 이름은 필수입니다.').max(50, '태그 이름은 50자 이내여야 합니다.'),
  postCount: z.number(),
  createdAt: z.string(),
});

/**
 * Tag list schema
 */
export const TagListSchema = z.array(TagSchema);

// Type exports
export type Tag = z.infer<typeof TagSchema>;
export type TagList = z.infer<typeof TagListSchema>;

/**
 * Validate tag
 */
export function validateTag(data: unknown): Tag | null {
  const result = TagSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Validate tag list
 */
export function validateTagList(data: unknown): Tag[] {
  if (!Array.isArray(data)) return [];

  return data
    .map(item => validateTag(item))
    .filter((tag): tag is Tag => tag !== null);
}
