/**
 * GET, POST /api/admin/posts
 * Admin: List all posts or create new post
 */
import { NextRequest } from 'next/server';
import { postService, embeddingService } from '@/lib/services';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { ValidationError, validatePostData } from '@/lib/utils/validation';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get('locale') || undefined;
    const page = parseInt(searchParams.get('page') || '0', 10);
    const size = parseInt(searchParams.get('size') || '10', 10);
    const sort = searchParams.get('sort') || 'createdAt,desc';

    const result = await postService.getAdminPosts({
      locale,
      page,
      size,
      sort,
    });

    return successResponse(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400);
    }
    console.error('GET /api/admin/posts error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const errors = validatePostData(body);
    if (errors.length > 0) {
      return errorResponse(errors.join(', '), 400);
    }

    const post = await postService.createPost({
      slug: body.slug,
      title: body.title,
      content: body.content,
      summary: body.summary,
      state: body.state,
      locale: body.locale,
      originalPostId: body.originalPostId,
      createdAt: body.createdAt,
    });

    // Trigger embedding generation (non-blocking)
    embeddingService.indexPost(post.id).catch(err => {
      console.error('Background embedding failed:', err);
    });

    return successResponse(post, 201);
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400);
    }
    console.error('POST /api/admin/posts error:', error);
    return errorResponse('Internal server error', 500);
  }
}
