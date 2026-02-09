/**
 * GET, PUT, DELETE /api/admin/posts/[id]
 * Admin: Get, update, or delete a specific post
 */
import { NextRequest } from 'next/server';
import { postService, embeddingService } from '@/lib/services';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { ValidationError, NotFoundError, parseId, validatePostData } from '@/lib/utils/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseId(id);

    if (postId === null) {
      return errorResponse('Invalid post ID', 400);
    }

    const post = await postService.getPostById(postId);

    if (!post) {
      return errorResponse('Post not found', 404);
    }

    return successResponse(post);
  } catch (error) {
    console.error('GET /api/admin/posts/[id] error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseId(id);

    if (postId === null) {
      return errorResponse('Invalid post ID', 400);
    }

    const body = await request.json();

    // Validate input
    const errors = validatePostData(body);
    if (errors.length > 0) {
      return errorResponse(errors.join(', '), 400);
    }

    const post = await postService.updatePost(postId, {
      slug: body.slug,
      title: body.title,
      content: body.content,
      summary: body.summary,
      tags: body.tags,
      state: body.state,
      createdAt: body.createdAt,
    });

    // Trigger embedding regeneration (non-blocking)
    embeddingService.indexPost(post.id).catch(err => {
      console.error('Background embedding failed:', err);
    });

    return successResponse(post);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return errorResponse(error.message, 404);
    }
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400);
    }
    console.error('PUT /api/admin/posts/[id] error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseId(id);

    if (postId === null) {
      return errorResponse('Invalid post ID', 400);
    }

    const result = await postService.deletePost(postId);

    // Delete embedding (non-blocking)
    embeddingService.deletePostEmbedding(postId).catch(err => {
      console.error('Failed to delete embedding:', err);
    });

    return successResponse(result);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return errorResponse(error.message, 404);
    }
    console.error('DELETE /api/admin/posts/[id] error:', error);
    return errorResponse('Internal server error', 500);
  }
}
