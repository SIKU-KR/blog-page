import useSWR from 'swr';
import { api } from '@/lib/api/index';
import type { AdminPostsResponse } from '@/types';

export function useAdminPosts(
  locale: string,
  page: number,
  pageSize: number,
  search?: string,
  state?: string
) {
  const { data, error, isLoading, mutate } = useSWR<AdminPostsResponse>(
    ['admin-posts', locale, page, pageSize, search, state],
    () => api.posts.getAdminList(page, pageSize, 'createdAt,desc', locale, search, state),
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
