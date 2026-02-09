/**
 * POST /api/admin/posts/[id]/translate
 * Admin: Translate a post and create English version
 */
import { NextRequest } from 'next/server';
import { postService, aiService, embeddingService } from '@/lib/services';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError, parseId } from '@/lib/utils/validation';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseId(id);

    if (postId === null) {
      return errorResponse('Invalid post ID', 400);
    }

    // Get the original post
    const originalPost = await postService.getPostById(postId);

    if (!originalPost) {
      return errorResponse('Post not found', 404);
    }

    // Only translate Korean posts
    if (originalPost.locale !== 'ko') {
      return errorResponse('Only Korean posts can be translated', 400);
    }

    // Translate content
    const translated = await aiService.translatePost(
      originalPost.title,
      originalPost.content,
      originalPost.summary
    );

    // Generate slug for English version
    const { slug } = await aiService.generateSlug(translated.title, translated.content);

    // Create the English version
    const englishPost = await postService.createPost({
      slug,
      title: translated.title,
      content: translated.content,
      summary: translated.summary || '',
      tags: originalPost.tags,
      state: originalPost.state,
      locale: 'en',
      originalPostId: postId,
    });

    // Trigger embedding generation (non-blocking)
    embeddingService.indexPost(englishPost.id).catch(err => {
      console.error('Background embedding failed:', err);
    });

    return successResponse(englishPost, 201);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return errorResponse(error.message, 404);
    }
    console.error('POST /api/admin/posts/[id]/translate error:', error);
    return errorResponse('Internal server error', 500);
  }
}
