/**
 * POST /api/admin/ai/summary
 * Admin: Generate AI summary for content
 */
import { NextRequest } from 'next/server';
import { aiService } from '@/lib/services';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.text || typeof body.text !== 'string') {
      return errorResponse('Text content is required', 400);
    }

    const result = await aiService.generateSummary(body.text);

    return successResponse(result);
  } catch (error) {
    console.error('POST /api/admin/ai/summary error:', error);
    return errorResponse('Internal server error', 500);
  }
}
