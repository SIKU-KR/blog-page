/**
 * GET, POST /api/admin/posts
 * Admin: List all posts or create new post
 */
import { NextRequest } from 'next/server';
import { postService, embeddingService } from '@/lib/services';
import { successResponse, withErrorHandling } from '@/lib/utils/response';
import { validatePostData, ValidationError } from '@/lib/utils/validation';
import { parseRequestParams } from '@/lib/utils/request';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const params = parseRequestParams(request);
  const result = await postService.getAdminPosts(params);
  return successResponse(result);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();

  // Validate input
  const errors = validatePostData(body);
  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }

  const post = await postService.createPost({
    slug: body.slug,
    title: body.title,
    content: body.content,
    summary: body.summary,
    state: body.state,
    createdAt: body.createdAt,
  });

  // Trigger embedding generation (non-blocking)
  embeddingService.indexPost(post.id).catch(err => {
    console.error('Background embedding failed:', err);
  });

  return successResponse(post, 201);
});
