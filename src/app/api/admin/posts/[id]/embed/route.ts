/**
 * POST /api/admin/posts/[id]/embed
 * Admin: Generate embedding for a specific post
 */
import { NextRequest } from 'next/server';
import { embeddingService } from '@/lib/services';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { parseId } from '@/lib/utils/validation';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const postId = parseId(id);

    if (postId === null) {
      return errorResponse('Invalid post ID', 400);
    }

    const result = await embeddingService.indexPost(postId);

    if (!result.success) {
      return errorResponse(result.error || 'Failed to generate embedding', 500);
    }

    return successResponse(result);
  } catch (error) {
    console.error('POST /api/admin/posts/[id]/embed error:', error);
    return errorResponse('Internal server error', 500);
  }
}
