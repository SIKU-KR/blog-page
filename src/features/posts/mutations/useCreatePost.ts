import { useSWRConfig } from 'swr';
import { useCallback } from 'react';
import { api } from '@/lib/api';
import type { Post, PostListResponse, CreatePostRequest } from '@/types';

/**
 * Mutation hook for creating a new post with optimistic updates
 *
 * Optimistic update pattern:
 * 1. Immediately update UI with temporary post
 * 2. Send request to server
 * 3. On success: revalidate to get server data
 * 4. On error: rollback to previous state
 *
 * @example
 * ```typescript
 * const createPost = useCreatePost();
 * await createPost({ title: 'New Post', content: '...' });
 * ```
 */
export function useCreatePost() {
  const { mutate } = useSWRConfig();

  return useCallback(
    async (input: CreatePostRequest) => {
      // Optimistic post (temporary ID)
      const optimisticPost: Partial<Post> = {
        id: Date.now(), // Temporary ID
        slug: input.slug,
        title: input.title,
        content: input.content,
        summary: input.summary,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistically update all posts lists
      mutate(
        (key: unknown) => {
          return typeof key === 'string' && key.includes('posts');
        },
        async (current?: PostListResponse) => {
          if (!current) return current;
          return {
            ...current,
            content: [optimisticPost as Post, ...current.content],
            totalElements: current.totalElements + 1,
          };
        },
        false // Don't revalidate yet
      );

      try {
        // Create post on server
        const newPost = await api.posts.create(input);

        // Revalidate all posts lists with server data
        await mutate((key: unknown) => typeof key === 'string' && key.includes('posts'));

        return newPost;
      } catch (error) {
        // Rollback on error
        await mutate((key: unknown) => typeof key === 'string' && key.includes('posts'));
        throw error;
      }
    },
    [mutate]
  );
}
