/**
 * GET, POST /api/comments/[postId]
 * Get comments for a post or create a new comment
 */
import { NextRequest } from 'next/server';
import { commentService } from '@/lib/services';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { ValidationError, NotFoundError, parseId } from '@/lib/utils/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const id = parseId(postId);

    if (id === null) {
      return errorResponse('Invalid post ID', 400);
    }

    const comments = await commentService.getCommentsByPostId(id);

    return successResponse(comments);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return errorResponse(error.message, 404);
    }
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400);
    }
    console.error('GET /api/comments/[postId] error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const id = parseId(postId);

    if (id === null) {
      return errorResponse('Invalid post ID', 400);
    }

    const body = await request.json();

    const comment = await commentService.createComment(id, {
      content: body.content,
      author: body.author,
    });

    return successResponse(comment, 201);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return errorResponse(error.message, 404);
    }
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400);
    }
    console.error('POST /api/comments/[postId] error:', error);
    return errorResponse('Internal server error', 500);
  }
}
