import { z } from 'zod';

/**
 * Draft schema for localStorage persistence
 * Validates draft objects saved during post editing
 */
export const DraftSchema = z.object({
  id: z.string().min(1, 'Draft ID는 필수입니다.'),
  title: z.string().default(''),
  content: z.string().default(''),
  summary: z.string().default(''),
  slug: z.string().default(''),
  timestamp: z.string(),
  displayName: z.string(),
  isAutoSave: z.boolean().default(false),
});

/**
 * Draft list schema
 */
export const DraftListSchema = z.array(DraftSchema);

/**
 * Draft snapshot for editor state
 */
export const DraftSnapshotSchema = z.object({
  title: z.string(),
  content: z.string(),
  summary: z.string(),
  slug: z.string(),
});

// Type exports
export type Draft = z.infer<typeof DraftSchema>;
export type DraftList = z.infer<typeof DraftListSchema>;
export type DraftSnapshot = z.infer<typeof DraftSnapshotSchema>;

/**
 * Validate draft from localStorage
 * Returns null if validation fails
 */
export function validateDraft(data: unknown): Draft | null {
  const result = DraftSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Validate draft list from localStorage
 * Filters out invalid drafts
 */
export function validateDraftList(data: unknown): Draft[] {
  if (!Array.isArray(data)) return [];

  return data
    .map(item => validateDraft(item))
    .filter((draft): draft is Draft => draft !== null);
}
