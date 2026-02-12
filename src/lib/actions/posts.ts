'use server';

import { getAuthenticatedUser } from './auth';
import { postService, embeddingService } from '@/lib/services';
import type { CreatePostRequest, UpdatePostRequest } from '@/types';

export async function createPostAction(data: CreatePostRequest) {
  await getAuthenticatedUser();

  const post = await postService.createPost({
    slug: data.slug,
    title: data.title,
    content: data.content,
    summary: data.summary,
    state: data.state,
    createdAt: data.createdAt,
  });

  // Trigger embedding generation (non-blocking)
  embeddingService.indexPost(post.id).catch(err => {
    console.error('Background embedding failed:', err);
  });

  return { success: true, post };
}

export async function updatePostAction(id: number, data: UpdatePostRequest) {
  await getAuthenticatedUser();

  const post = await postService.updatePost(id, {
    slug: data.slug,
    title: data.title,
    content: data.content,
    summary: data.summary || '',
    state: data.state,
    createdAt: data.createdAt,
  });

  // Trigger embedding regeneration (non-blocking)
  embeddingService.indexPost(post.id).catch(err => {
    console.error('Background embedding failed:', err);
  });

  return { success: true, post };
}

export async function deletePostAction(id: number) {
  await getAuthenticatedUser();

  await postService.deletePost(id);

  // Delete embedding (non-blocking)
  embeddingService.deletePostEmbedding(id).catch(err => {
    console.error('Failed to delete embedding:', err);
  });

  return { success: true };
}
