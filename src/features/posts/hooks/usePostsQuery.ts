import useSWR from 'swr';
import { api } from '@/lib/api';

/**
 * Hook for fetching paginated posts with SWR
 * Provides automatic caching, revalidation, and error handling
 */
export function usePostsQuery(
  page: number = 0,
  size: number = 10,
  sort: string = 'createdAt,desc',
  locale?: string
) {
  return useSWR(['posts', page, size, sort, locale], () =>
    api.posts.getList(page, size, sort, locale)
  );
}

/**
 * Hook for fetching a single post by slug
 */
export function usePostQuery(slug: string) {
  return useSWR(slug ? ['post', slug] : null, () => api.posts.getBySlug(slug));
}

/**
 * Hook for fetching a post by ID
 */
export function usePostByIdQuery(id: number) {
  return useSWR(id ? ['post', 'id', id] : null, () => api.posts.getOne(id));
}
