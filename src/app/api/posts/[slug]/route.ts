/**
 * GET /api/posts/[slug]
 * Get single post by slug with related posts
 */
import { NextRequest } from 'next/server';
import { postService, embeddingService } from '@/lib/services';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { ValidationError, NotFoundError } from '@/lib/utils/validation';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const post = await postService.getPostBySlug(slug);

    // Get related posts using vector similarity
    let relatedPosts: Array<{ id: number; slug: string; title: string; similarity: number }> = [];
    try {
      relatedPosts = await embeddingService.findSimilarPosts(post.id, 4);
    } catch {
      // Gracefully handle embedding service failures
      console.error('Failed to get related posts');
    }

    return successResponse({
      ...post,
      relatedPosts,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return errorResponse(error.message, 404);
    }
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400);
    }
    console.error('GET /api/posts/[slug] error:', error);
    return errorResponse('Internal server error', 500);
  }
}
