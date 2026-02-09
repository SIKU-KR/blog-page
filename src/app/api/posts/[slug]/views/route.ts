/**
 * PATCH /api/posts/[slug]/views
 * Increment post view counter
 * Note: slug param here receives the post ID as a string (e.g., "123")
 */
import { NextRequest } from 'next/server';
import { postService } from '@/lib/services';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { ValidationError, NotFoundError, parseId } from '@/lib/utils/validation';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const postId = parseId(slug);

    if (postId === null) {
      return errorResponse('Invalid post ID', 400);
    }

    const result = await postService.incrementViews(postId);

    return successResponse(result);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return errorResponse(error.message, 404);
    }
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400);
    }
    console.error('PATCH /api/posts/[slug]/views error:', error);
    return errorResponse('Internal server error', 500);
  }
}
