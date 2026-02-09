/**
 * GET /api/posts
 * List published posts with pagination
 */
import { NextRequest } from 'next/server';
import { postService } from '@/lib/services';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { ValidationError } from '@/lib/utils/validation';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tag = searchParams.get('tag');
    const locale = searchParams.get('locale') || 'ko';
    const page = parseInt(searchParams.get('page') || '0', 10);
    const size = parseInt(searchParams.get('size') || '10', 10);
    const sort = searchParams.get('sort') || 'createdAt,desc';

    const result = await postService.getPosts({
      tag,
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
    console.error('GET /api/posts error:', error);
    return errorResponse('Internal server error', 500);
  }
}
