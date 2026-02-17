import useSWR from 'swr';
import { api } from '@/lib/api/index';
import type { AdminPostsResponse } from '@/types';

const ADMIN_POSTS_SORT = 'createdAt,desc';

export function useAdminPosts(page: number, pageSize: number, search?: string, state?: string) {
  const normalizedSearch = search || undefined;
  const normalizedState = state || undefined;

  const { data, error, isLoading, mutate } = useSWR<AdminPostsResponse>(
    [
      'admin-posts',
      {
        page,
        pageSize,
        search: normalizedSearch ?? null,
        sort: ADMIN_POSTS_SORT,
        state: normalizedState ?? null,
      },
    ],
    () =>
      api.posts.getAdminList(page, pageSize, ADMIN_POSTS_SORT, normalizedSearch, normalizedState),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  return {
    posts: data?.content ?? [],
    totalPosts: data?.totalElements ?? 0,
    isLoading,
    error,
    mutate,
  };
}
