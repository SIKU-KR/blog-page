import useSWR from 'swr';
import { api } from '@/lib/api/index';
import type { Post } from '@/types';

export function useAdminPost(postId: number | null) {
  const { data, error, isLoading } = useSWR<Post>(
    postId ? ['admin-post', postId] : null,
    () => api.posts.getAdminOne(postId!),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    post: data ?? null,
    isLoading,
    error,
  };
}
