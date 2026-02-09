/**
 * GET /api/posts/[slug]
 * Get single post by slug with related posts
 */
import { NextRequest, NextResponse } from 'next/server';
import { postService, embeddingService } from '@/lib/services';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { ValidationError, NotFoundError } from '@/lib/utils/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get('locale') || undefined;

    const result = await postService.getPostBySlug(slug, locale);

    // Handle redirect case
    if (result.redirect) {
      const redirectUrl = locale
        ? `/${result.locale}/${result.slug}`
        : `/${result.slug}`;
      return NextResponse.redirect(new URL(redirectUrl, request.url), 301);
    }

    // Get related posts using vector similarity
    let relatedPosts: Array<{ id: number; slug: string; title: string; similarity: number }> = [];
    try {
      relatedPosts = await embeddingService.findSimilarPosts(
        result.data.id,
        result.data.locale,
        4
      );
    } catch {
      // Gracefully handle embedding service failures
      console.error('Failed to get related posts');
    }

    return successResponse({
      ...result.data,
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
