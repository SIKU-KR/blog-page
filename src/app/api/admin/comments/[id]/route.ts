/**
 * DELETE /api/admin/comments/[id]
 * Admin: Delete a comment
 */
import { NextRequest } from 'next/server';
import { commentService } from '@/lib/services';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError } from '@/lib/utils/validation';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id.length < 36) {
      return errorResponse('Invalid comment ID', 400);
    }

    const result = await commentService.deleteComment(id);

    return successResponse(result);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return errorResponse(error.message, 404);
    }
    console.error('DELETE /api/admin/comments/[id] error:', error);
    return errorResponse('Internal server error', 500);
  }
}
