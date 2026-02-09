/**
 * POST /api/admin/ai/slug
 * Admin: Generate AI slug from title and content
 */
import { NextRequest } from 'next/server';
import { aiService } from '@/lib/services';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title || typeof body.title !== 'string') {
      return errorResponse('Title is required', 400);
    }

    const content = body.content || '';

    const result = await aiService.generateSlug(body.title, content);

    return successResponse(result);
  } catch (error) {
    console.error('POST /api/admin/ai/slug error:', error);
    return errorResponse('Internal server error', 500);
  }
}
