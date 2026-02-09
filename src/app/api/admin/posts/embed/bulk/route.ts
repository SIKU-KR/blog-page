/**
 * POST /api/admin/posts/embed/bulk
 * Admin: Generate embeddings for all posts
 */
import { embeddingService } from '@/lib/services';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function POST() {
  try {
    const result = await embeddingService.bulkIndexPosts();

    return successResponse(result);
  } catch (error) {
    console.error('POST /api/admin/posts/embed/bulk error:', error);
    return errorResponse('Internal server error', 500);
  }
}
