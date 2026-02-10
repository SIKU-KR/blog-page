'use server';

import { getAuthenticatedUser } from './auth';
import { postService, embeddingService, aiService } from '@/lib/services';
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

export async function translatePostAction(id: number) {
  await getAuthenticatedUser();

  const originalPost = await postService.getPostById(id);
  if (!originalPost) {
    throw new Error('Post not found');
  }

  if (originalPost.locale !== 'ko') {
    throw new Error('Only Korean posts can be translated');
  }

  const translated = await aiService.translatePost(
    originalPost.title,
    originalPost.content,
    originalPost.summary
  );

  const { slug } = await aiService.generateSlug(translated.title, translated.content);

  const englishPost = await postService.createPost({
    slug,
    title: translated.title,
    content: translated.content,
    summary: translated.summary || '',
    state: originalPost.state,
    locale: 'en',
    originalPostId: id,
  });

  // Trigger embedding generation (non-blocking)
  embeddingService.indexPost(englishPost.id).catch(err => {
    console.error('Background embedding failed:', err);
  });

  return { success: true, translatedPost: englishPost };
}
