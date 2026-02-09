/**
 * GET /api/tags
 * Get all active tags
 */
import { NextRequest } from 'next/server';
import { tagService } from '@/lib/services';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const locale = searchParams.get('locale') || undefined;

    const tags = await tagService.getActiveTags(locale);

    return successResponse(tags);
  } catch (error) {
    console.error('GET /api/tags error:', error);
    return errorResponse('Internal server error', 500);
  }
}
